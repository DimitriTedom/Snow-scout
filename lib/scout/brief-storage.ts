import type { OutlierBrief } from "@/lib/scout/outlier-brief";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

import { storageListPrefixes, storageReadJson, storageWriteJson } from "./supabase-storage";
import { getScoutBriefsBucket } from "./config";

export type StoredBriefMeta = {
  videoId: string;
  title: string;
  storagePath: string;
  savedAt: string;
  savedIdeaId?: string;
};

export type SaveBriefResult = {
  storagePath: string | null;
  savedIdeaId: string;
  storage: "supabase" | "db";
};

export function briefObjectPath(userId: string, projectId: string, videoId: string): string {
  return `${userId}/${projectId}/${videoId}.json`;
}

async function upsertSavedIdea(projectId: string, brief: OutlierBrief) {
  const videoId = brief.sourceOutlier.videoId;

  const existing = await prisma.savedIdea.findFirst({
    where: { projectId, sourceVideoId: videoId },
    orderBy: { updatedAt: "desc" },
  });

  const ideaPayload = {
    sourceVideoId: videoId,
    sourceTitle: brief.sourceOutlier.title,
    sourceUrl: brief.sourceOutlier.url,
    remixTitle: brief.sourceOutlier.title,
    remixHook: brief.grokPastePrompt.slice(0, 500),
    remixAngle: brief.userRemixMethod,
    outlierScore: brief.sourceOutlier.statistics.outlierScore,
    engagementRate: brief.sourceOutlier.statistics.engagementRate,
    briefJson: brief as object,
    status: "DRAFT" as const,
  };

  return existing
    ? prisma.savedIdea.update({
        where: { id: existing.id },
        data: ideaPayload,
      })
    : prisma.savedIdea.create({
        data: { projectId, ...ideaPayload },
      });
}

export async function saveUserBrief(
  userId: string,
  projectId: string,
  brief: OutlierBrief,
): Promise<SaveBriefResult> {
  const savedIdea = await upsertSavedIdea(projectId, brief);

  const admin = createSupabaseAdminClient();
  if (admin) {
    const storagePath = briefObjectPath(userId, projectId, brief.sourceOutlier.videoId);
    const ok = await storageWriteJson(getScoutBriefsBucket(), storagePath, brief);
    if (ok) {
      return { storagePath, savedIdeaId: savedIdea.id, storage: "supabase" };
    }
  }

  return {
    storagePath: null,
    savedIdeaId: savedIdea.id,
    storage: "db",
  };
}

export async function loadUserBrief(
  userId: string,
  projectId: string,
  videoId: string,
): Promise<OutlierBrief | null> {
  const fromStorage = await storageReadJson<OutlierBrief>(
    getScoutBriefsBucket(),
    briefObjectPath(userId, projectId, videoId),
  );
  if (fromStorage) return fromStorage;

  const fromDb = await prisma.savedIdea.findFirst({
    where: { projectId, sourceVideoId: videoId },
    orderBy: { updatedAt: "desc" },
  });

  return fromDb?.briefJson ? (fromDb.briefJson as OutlierBrief) : null;
}

export async function loadLatestUserBrief(
  userId: string,
  projectId: string,
): Promise<{ brief: OutlierBrief; meta: StoredBriefMeta } | null> {
  const bucket = getScoutBriefsBucket();
  const prefix = `${userId}/${projectId}`;
  const files = await storageListPrefixes(bucket, prefix);

  for (const file of files) {
    const brief = await storageReadJson<OutlierBrief>(bucket, `${prefix}/${file}`);
    if (!brief?.sourceOutlier?.videoId) continue;
    return {
      brief,
      meta: {
        videoId: brief.sourceOutlier.videoId,
        title: brief.sourceOutlier.title,
        storagePath: `${prefix}/${file}`,
        savedAt: brief.generatedAt,
      },
    };
  }

  const fromDb = await prisma.savedIdea.findFirst({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });

  if (fromDb?.briefJson) {
    const brief = fromDb.briefJson as OutlierBrief;
    return {
      brief,
      meta: {
        videoId: fromDb.sourceVideoId ?? brief.sourceOutlier?.videoId ?? "unknown",
        title: fromDb.sourceTitle ?? brief.sourceOutlier?.title ?? "Saved brief",
        storagePath: `db://${fromDb.id}`,
        savedAt: fromDb.updatedAt.toISOString(),
        savedIdeaId: fromDb.id,
      },
    };
  }

  return null;
}

export async function listUserBriefs(userId: string, projectId: string): Promise<StoredBriefMeta[]> {
  const bucket = getScoutBriefsBucket();
  const prefix = `${userId}/${projectId}`;
  const files = await storageListPrefixes(bucket, prefix);
  const metas: StoredBriefMeta[] = [];

  for (const file of files) {
    const brief = await storageReadJson<OutlierBrief>(bucket, `${prefix}/${file}`);
    if (!brief?.sourceOutlier?.videoId) continue;
    metas.push({
      videoId: brief.sourceOutlier.videoId,
      title: brief.sourceOutlier.title,
      storagePath: `${prefix}/${file}`,
      savedAt: brief.generatedAt,
    });
  }

  if (metas.length > 0) return metas;

  const fromDb = await prisma.savedIdea.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });

  return fromDb.filter((idea) => idea.briefJson != null).map((idea) => {
    const brief = idea.briefJson as OutlierBrief | null;
    return {
      videoId: idea.sourceVideoId ?? brief?.sourceOutlier?.videoId ?? "unknown",
      title: idea.sourceTitle ?? brief?.sourceOutlier?.title ?? "Saved brief",
      storagePath: `db://${idea.id}`,
      savedAt: idea.updatedAt.toISOString(),
      savedIdeaId: idea.id,
    };
  });
}