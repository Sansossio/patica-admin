"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Generic modal dialog: dimmed backdrop, centered card, close on ✕ / Esc /
 * backdrop click. Render it controlled (`open` + `onClose`). Children mount only
 * while open, so any internal form/action state resets on each open.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn("my-16 w-full", maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div className="rounded-(--radius-card) border border-border bg-bg p-5 shadow-2xl shadow-black/50">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-muted transition hover:bg-surface-2 hover:text-text"
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
