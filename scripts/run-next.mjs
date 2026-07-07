import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const args = process.argv.slice(2);

if (!existsSync(nextBin)) {
  console.error("Next.js binary not found. Run: npm run install:safe");
  process.exit(1);
}

const isDev = args[0] === "dev";
const env = { ...process.env };
if (isDev && !env.NODE_OPTIONS?.includes("max-old-space-size")) {
  env.NODE_OPTIONS = [env.NODE_OPTIONS, "--max-old-space-size=4096"].filter(Boolean).join(" ");
}

const result = spawnSync(process.execPath, [nextBin, ...args], {
  cwd: root,
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);