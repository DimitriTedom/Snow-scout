import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { extractVideoId } from "./youtube";

export async function downloadThumbnail(
  videoIdOrUrl: string,
  outputDir: string,
  filename = "thumbnail-ref.jpg",
): Promise<string> {
  const videoId = extractVideoId(videoIdOrUrl) ?? videoIdOrUrl;
  const urls = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
  ];

  await mkdir(outputDir, { recursive: true });
  const outPath = join(outputDir, filename);

  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) continue;
    await writeFile(outPath, buf);
    return outPath;
  }

  throw new Error(`Could not download thumbnail for ${videoId}`);
}