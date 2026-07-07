import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { analyzeVideo } from "@/lib/scout/youtube";

const bodySchema = z.object({
  videoUrl: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const video = await analyzeVideo(parsed.data.videoUrl);
    if (!video) {
      return NextResponse.json({ error: "Invalid YouTube URL or video ID" }, { status: 400 });
    }
    return NextResponse.json({ video });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analyze failed" },
      { status: 500 },
    );
  }
}