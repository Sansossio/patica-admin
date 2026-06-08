"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";

/**
 * Live "online now" count. Seeds from the server-rendered value (instant first
 * paint), then polls `/api/online` every 5s. Pauses while the tab is hidden to
 * avoid hammering KV, and refreshes immediately on re-focus.
 */
export function OnlineCount({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/online", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (active && typeof data.count === "number") setCount(data.count);
      } catch {
        // transient network error — keep the last known value
      }
    };

    const id = setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />
      {formatNumber(count)}
    </span>
  );
}
