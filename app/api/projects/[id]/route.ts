import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  bibleText: z.string().optional(),
  biblePath: z.string().optional(),
  titleFormulas: z.string().optional(),
  thumbnailNotes: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.channelProject.findFirst({
    where: { id, userId: user.id },
    include: {
      competitors: { orderBy: { createdAt: "asc" } },
      keywords: { orderBy: { createdAt: "asc" } },
      outliers: { orderBy: { createdAt: "desc" } },
      ideas: { orderBy: { updatedAt: "desc" }, take: 20 },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.channelProject.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await prisma.channelProject.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.channelProject.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.channelProject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}