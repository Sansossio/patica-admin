import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

/** Placeholder rows for a table/list while its data streams in. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-[14px]">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4", c === 0 ? "w-44" : "w-20 max-w-[140px] flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
