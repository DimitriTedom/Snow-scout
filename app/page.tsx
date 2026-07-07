import Link from "next/link";
import { ArrowRight, BarChart3, Layers, Radar, Sparkles } from "lucide-react";

import { ScoutWorkflowSteps } from "@/components/scout/workflow-steps";
import NumberTicker from "@/components/ui/number-ticker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BarChart3,
    title: "Engagement-ranked",
    description: "Outlier score weights comments, likes, and velocity — not raw views alone.",
  },
  {
    icon: Layers,
    title: "Cross-niche remix",
    description: "Angle-shift viral topics through any channel bible you paste in.",
  },
  {
    icon: Radar,
    title: "Multi-tenant",
    description: "Competitors, keywords, and seed outliers per project — any creator, any niche.",
  },
  {
    icon: Sparkles,
    title: "Snow pipeline",
    description: "Hands off to Snow Transcriber and Snow Assembler when the idea is locked.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/50 p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative max-w-3xl space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>Snow Video Studio</Badge>
            <Badge variant="secondary">Phase 0 — Ideation</Badge>
          </div>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Stop guessing what to film.
            <span className="mt-2 block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Hunt what already went viral.
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Snow Scout finds engagement-weighted YouTube outliers, downloads thumbnail references, and
            remixes proven topics into your channel bible — before you write a single line of script.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="cursor-pointer snow-glow">
              <Link href="/scout">
                Open workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="cursor-pointer border-white/15">
              <Link href="/mcp">Connect AI (MCP)</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="cursor-pointer border-white/15">
              <a href="https://github.com/DimitriTedom/Snow-scout" target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-background/40 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">API rotation</p>
            <p className="mt-2 text-2xl font-semibold">
              <NumberTicker value={2} />+ keys
            </p>
            <p className="mt-1 text-xs text-muted-foreground">YouTube + OpenRouter</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/40 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Remix modes</p>
            <p className="mt-2 text-2xl font-semibold">
              <NumberTicker value={3} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">OpenRouter · template · agent</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/40 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pipeline</p>
            <p className="mt-2 text-2xl font-semibold text-accent">Scout → Transcriber → Assembler</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">The right workflow</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Most creators start with a blank doc. Snow Scout starts with proof — then remixes the
            structure, not the script.
          </p>
        </div>
        <ScoutWorkflowSteps />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="snow-panel group cursor-default p-5 transition-colors duration-200 hover:border-primary/25"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="snow-panel flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Ready to find your next outlier?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a channel project, paste your bible, search, remix, pick an idea.
          </p>
        </div>
        <Button asChild size="lg" className="cursor-pointer snow-glow shrink-0">
          <Link href="/scout">
            Start scouting
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}