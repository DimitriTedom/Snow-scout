#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getScoutApiUrl } from "./client.js";
import { SNOW_SCOUT_WORKFLOW } from "./workflow.js";

function textResult(text: string, structured?: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

const server = new McpServer({
  name: "snow-scout-mcp-server",
  version: "0.1.0",
});

server.registerResource(
  "workflow-guide",
  "snow://scout/workflow/guide",
  {
    title: "Snow Scout Agent Workflow",
    description: "Viral ideation and cross-niche remix workflow for YouTube creators",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "snow://scout/workflow/guide",
        mimeType: "text/markdown",
        text: SNOW_SCOUT_WORKFLOW,
      },
    ],
  }),
);

server.registerTool(
  "scout_health",
  {
    title: "Snow Scout Health",
    description: "Check Snow Scout API reachability.",
    inputSchema: z.object({}).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  },
  async () => {
    const url = getScoutApiUrl();
    try {
      const res = await fetch(`${url}/api/health`);
      const ok = res.ok;
      return textResult(ok ? `Snow Scout **online** at ${url}` : `Snow Scout returned ${res.status}`, {
        url,
        ok,
      });
    } catch (err) {
      return textResult(
        `Snow Scout **offline** at ${url}. Run \`npm run dev\` in Snow-scout. ${err instanceof Error ? err.message : ""}`,
        { url, ok: false },
      );
    }
  },
);

server.registerTool(
  "scout_search_outliers",
  {
    title: "Search Viral Outliers",
    description:
      "Search YouTube by keyword and return videos ranked by engagement-weighted outlier score. Requires authenticated Scout session or future API token.",
    inputSchema: z
      .object({
        query: z.string().min(1),
        project_id: z.string().optional(),
        max_results: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false },
  },
  async ({ query, project_id, max_results }) => {
    return textResult(
      `Use POST ${getScoutApiUrl()}/api/scout/search with body: ${JSON.stringify({ query, projectId: project_id, maxResults: max_results })}. MCP direct proxy requires SCOUT_API_TOKEN (v1.1). For now, call from the Scout UI or authenticated browser session.`,
      { query, projectId: project_id, hint: "authenticated_api" },
    );
  },
);

server.registerTool(
  "scout_remix_ideas",
  {
    title: "Remix Outlier Into Channel Niche",
    description:
      "Angle-shift a viral video into 2–3 ideas using the project channel bible. Uses OpenRouter free models with key+model rotation when configured.",
    inputSchema: z
      .object({
        project_id: z.string(),
        video_url: z.string().min(1),
        count: z.number().int().min(1).max(5).optional(),
      })
      .strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false },
  },
  async ({ project_id, video_url, count }) => {
    return textResult(
      `Use POST ${getScoutApiUrl()}/api/scout/remix with body: ${JSON.stringify({ projectId: project_id, videoUrl: video_url, count })}.`,
      { projectId: project_id, videoUrl: video_url, count },
    );
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});