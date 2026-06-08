"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function ChatModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div className="my-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-(--radius-card) border border-border bg-bg p-5 shadow-2xl shadow-black/50">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Conversación</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="rounded-lg px-2 py-1 text-lg leading-none text-muted transition hover:bg-surface-2 hover:text-text"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
