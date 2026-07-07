import { IdeaStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { getUserRemix, updateRemixStatus } from "@/lib/scout/saved-ideas";

const patchSchema = z.object({
  status: z.nativeEnum(IdeaStatus),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const remix = await getUserRemix(user.id, id);
  if (!remix) return NextResponse.json({ error: "Remix not found" }, { status: 404 });

  return NextResponse.json({ remix });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateRemixStatus(user.id, id, parsed.data.status);
  if (!updated) return NextResponse.json({ error: "Remix not found" }, { status: 404 });

  return NextResponse.json({ id: updated.id, status: updated.status });
}