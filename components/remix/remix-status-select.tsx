"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IdeaStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { IDEA_STATUS_LABELS } from "@/lib/scout/saved-ideas";

const STATUSES: IdeaStatus[] = [
  "DRAFT",
  "SHORTLISTED",
  "APPROVED",
  "IN_PRODUCTION",
  "PUBLISHED",
  "ARCHIVED",
];

export function RemixStatusSelect({
  ideaId,
  initialStatus,
}: {
  ideaId: string;
  initialStatus: IdeaStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  async function onChange(next: IdeaStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/scout/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setStatus(next);
      toast.success(`Status → ${IDEA_STATUS_LABELS[next]}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <select
        value={status}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as IdeaStatus)}
        aria-label="Remix production status"
        className="h-9 min-w-[10rem] cursor-pointer appearance-none rounded-xl border border-white/10 bg-background/60 px-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {IDEA_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {saving && (
        <Loader2
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden
        />
      )}
    </div>
  );
}