"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconRefresh } from "./icons";

/**
 * Reusable "Actualizar" control for server-rendered pages: calls
 * router.refresh() inside a transition so React keeps the current UI mounted
 * (including any open modals) while the server re-runs and streams fresh props
 * down. Shows a spinning icon and disables itself while the refresh is pending.
 *
 * Used both in the /activity PageHeader actions and inside the Activity day
 * modal header — one source of truth for the refresh affordance.
 */
export function RefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      aria-label="Actualizar"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-(--radius-button) border border-border px-2.5 py-1 text-xs font-medium text-muted transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <IconRefresh className={cn("h-4 w-4", isPending && "animate-spin")} />
      Actualizar
    </button>
  );
}
