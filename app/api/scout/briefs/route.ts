import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import {
  loadLatestUserBrief,
  loadUserBrief,
  saveUserBrief,
  type StoredBriefMeta,
} from "@/lib/scout/brief-storage";
import type { OutlierBrief } from "@/lib/scout/outlier-brief";
import { isBriefStorageConfigured } from "@/lib/supabase/admin";

const getQuerySchema = z.object({
  projectId: z.string(),
  videoId: z.string().optional(),
});

const postBodySchema = z.object({
  projectId: z.string(),
  brief: z.record(z.unknown()),
});

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = getQuerySchema.safeParse({
    projectId: url.searchParams.get("projectId"),
    videoId: url.searchParams.get("videoId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.channelProject.findFirst({
    where: { id: parsed.data.projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let result: { brief: OutlierBrief; meta: StoredBriefMeta } | null = null;

  if (parsed.data.videoId) {
    const brief = await loadUserBrief(user.id, project.id, parsed.data.videoId);
    if (brief) {
      result = {
        brief,
        meta: {
          videoId: brief.sourceOutlier.videoId,
          title: brief.sourceOutlier.title,
          storagePath: `${user.id}/${project.id}/${brief.sourceOutlier.videoId}.json`,
          savedAt: brief.generatedAt,
        },
      };
    }
  } else {
    result = await loadLatestUserBrief(user.id, project.id);
  }

  return NextResponse.json({
    brief: result?.brief ?? null,
    meta: result?.meta ?? null,
    storage: isBriefStorageConfigured() ? "supabase" : "db",
  });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = postBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.channelProject.findFirst({
    where: { id: parsed.data.projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const brief = parsed.data.brief as OutlierBrief;
  if (!brief?.sourceOutlier?.videoId) {
    return NextResponse.json({ error: "Invalid brief payload" }, { status: 400 });
  }

  const saved = await saveUserBrief(user.id, project.id, brief);

  return NextResponse.json({
    storagePath: saved.storagePath,
    savedIdeaId: saved.savedIdeaId,
    storage: saved.storage,
  });
}