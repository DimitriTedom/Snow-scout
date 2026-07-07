"use client";

import { Copy, Download } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import type { OutlierBrief } from "@/lib/scout/outlier-brief";

async function copyText(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function downloadJson(brief: OutlierBrief) {
  const slug = brief.sourceOutlier.videoId;
  const blob = new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scout-outlier-brief_${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("JSON downloaded");
}

export function RemixDetailActions({ brief }: { brief: OutlierBrief }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer"
        onClick={() => copyText(JSON.stringify(brief, null, 2), "Full JSON")}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Copy JSON
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer"
        onClick={() => copyText(brief.grokPastePrompt, "Grok prompt")}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Copy Grok prompt
      </Button>
      <Button size="sm" className="cursor-pointer snow-glow" onClick={() => downloadJson(brief)}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Download .json
      </Button>
    </div>
  );
}