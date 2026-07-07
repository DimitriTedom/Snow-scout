import Link from "next/link";
import { ArrowLeft, Plug } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "MCP Setup",
  description: "Connect Antigravity, Cursor, and Grok to Snow Scout via MCP.",
};

export default function McpSetupPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 cursor-pointer px-2 text-muted-foreground">
          <Link href="/scout">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Workspace
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Plug className="h-3 w-3" />
            Agent setup
          </Badge>
          <Badge variant="secondary">Grok · Antigravity · Cursor</Badge>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Connect your <span className="text-primary">AI via MCP</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Build the MCP server, add it to your agent config, and use scout_* tools for outlier search
          and remix briefs.
        </p>
      </div>

      <div className="snow-panel space-y-4 p-6 font-mono text-sm">
        <p className="text-muted-foreground"># Build MCP server</p>
        <p>npm run mcp:install</p>
        <p>npm run mcp:build</p>
        <p className="pt-4 text-muted-foreground"># Add to ~/.grok/config.toml or Antigravity MCP</p>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-background/60 p-4 text-xs leading-relaxed">
{`[mcp_servers.snow-scout]
command = "node"
args = ["D:/SnowDev/Videos/Youtube/CRAVE & CONQUER/Snow-scout/mcp-server/dist/index.js"]
env = { SCOUT_API_URL = "http://localhost:3002" }`}
        </pre>
        <p className="text-xs text-muted-foreground">
          Tools: scout_health, scout_search_outliers, scout_outlier_brief · Resource: snow://scout/workflow/guide
        </p>
      </div>
    </div>
  );
}