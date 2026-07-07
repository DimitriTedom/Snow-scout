import type { IdeaStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { OutlierBrief } from "@/lib/scout/outlier-brief";

export type RemixListItem = {
  id: string;
  projectId: string;
  projectName: string;
  sourceVideoId: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  remixTitle: string;
  remixAngle: string | null;
  outlierScore: number | null;
  engagementRate: number | null;
  status: IdeaStatus;
  hasBrief: boolean;
  thumbnailUrl: string | null;
  engagementTier: string | null;
  scoutIdeaCount: number;
  updatedAt: Date;
};

export type RemixDetail = RemixListItem & {
  remixHook: string | null;
  brief: OutlierBrief | null;
  storageHint: string | null;
};

export async function listUserRemixes(
  userId: string,
  options?: { projectId?: string },
): Promise<RemixListItem[]> {
  const ideas = await prisma.savedIdea.findMany({
    where: {
      project: { userId },
      ...(options?.projectId ? { projectId: options.projectId } : {}),
    },
    include: { project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return ideas.filter((idea) => idea.briefJson != null).map((idea) => {
    const brief = idea.briefJson as OutlierBrief | null;
    return {
      id: idea.id,
      projectId: idea.projectId,
      projectName: idea.project.name,
      sourceVideoId: idea.sourceVideoId,
      sourceTitle: idea.sourceTitle,
      sourceUrl: idea.sourceUrl,
      remixTitle: idea.remixTitle,
      remixAngle: idea.remixAngle,
      outlierScore: idea.outlierScore,
      engagementRate: idea.engagementRate,
      status: idea.status,
      hasBrief: Boolean(brief),
      thumbnailUrl: brief?.sourceOutlier?.thumbnailUrl ?? null,
      engagementTier: brief?.viralSignals?.engagementTier ?? null,
      scoutIdeaCount: brief?.scoutGeneratedIdeas?.length ?? 0,
      updatedAt: idea.updatedAt,
    };
  });
}

export async function getUserRemix(userId: string, ideaId: string): Promise<RemixDetail | null> {
  const idea = await prisma.savedIdea.findFirst({
    where: { id: ideaId, project: { userId } },
    include: { project: { select: { name: true, id: true } } },
  });

  if (!idea) return null;

  const brief = idea.briefJson as OutlierBrief | null;

  return {
    id: idea.id,
    projectId: idea.projectId,
    projectName: idea.project.name,
    sourceVideoId: idea.sourceVideoId,
    sourceTitle: idea.sourceTitle,
    sourceUrl: idea.sourceUrl,
    remixTitle: idea.remixTitle,
    remixAngle: idea.remixAngle,
    outlierScore: idea.outlierScore,
    engagementRate: idea.engagementRate,
    status: idea.status,
    hasBrief: Boolean(brief),
    thumbnailUrl: brief?.sourceOutlier?.thumbnailUrl ?? null,
    engagementTier: brief?.viralSignals?.engagementTier ?? null,
    scoutIdeaCount: brief?.scoutGeneratedIdeas?.length ?? 0,
    updatedAt: idea.updatedAt,
    remixHook: idea.remixHook,
    brief,
    storageHint: brief ? `db://${idea.id}` : null,
  };
}

export async function updateRemixStatus(userId: string, ideaId: string, status: IdeaStatus) {
  const idea = await prisma.savedIdea.findFirst({
    where: { id: ideaId, project: { userId } },
    select: { id: true },
  });
  if (!idea) return null;

  return prisma.savedIdea.update({
    where: { id: ideaId },
    data: { status },
    select: { id: true, status: true },
  });
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  DRAFT: "Draft",
  SHORTLISTED: "Shortlisted",
  APPROVED: "Approved",
  IN_PRODUCTION: "In production",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const IDEA_STATUS_VARIANT: Record<
  IdeaStatus,
  "default" | "secondary" | "success" | "warning" | "outline"
> = {
  DRAFT: "outline",
  SHORTLISTED: "secondary",
  APPROVED: "default",
  IN_PRODUCTION: "warning",
  PUBLISHED: "success",
  ARCHIVED: "outline",
};