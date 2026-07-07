import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  description: z.string().max(500).optional(),
  bibleText: z.string().optional(),
  biblePath: z.string().optional(),
  titleFormulas: z.string().optional(),
  thumbnailNotes: z.string().optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.channelProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { competitors: true, keywords: true, outliers: true, ideas: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.channelProject.count({ where: { userId: user.id } });

  try {
    const project = await prisma.channelProject.create({
      data: {
        userId: user.id,
        isDefault: count === 0,
        ...parsed.data,
      },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already exists for your account" }, { status: 409 });
  }
}