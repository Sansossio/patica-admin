"use client";

import { useEffect, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconRefresh } from "./icons";

/**
 * Module-level stack of open modal ids, ordered by mount. The last entry is the
 * topmost; only it reacts to a global Escape press so stacked modals close one
 * at a time (innermost first).
 */
const modalStack: string[] = [];

/**
 * Generic modal dialog: dimmed backdrop, centered card, close on ✕ / Esc /
 * backdrop click. Render it controlled (`open` + `onClose`). Children mount only
 * while open, so any internal form/action state resets on each open.
 *
 * Stackable: pass distinct `zIndex` for nested modals (e.g. "z-50" then
 * "z-[60]"). Escape closes only the topmost modal; backdrop clicks hit only the
 * modal whose overlay was clicked (the topmost is visually on top).
 *
 * Optional `headerExtra` renders inline before the ✕ button (e.g. a refresh
 * action), so callers can add header controls without re-styling the chrome.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  zIndex = "z-50",
  headerExtra,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  zIndex?: string;
  headerExtra?: ReactNode;
}) {
  const id = useId();

  // Register/unregister this modal in the stack while it is open, and close on
  // Escape only when this modal is the topmost entry.
  useEffect(() => {
    if (!open) return;
    modalStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalStack[modalStack.length - 1] === id) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const idx = modalStack.lastIndexOf(id);
      if (idx !== -1) modalStack.splice(idx, 1);
    };
  }, [open, id, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm",
        zIndex,
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn("my-16 w-full", maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div className="rounded-(--radius-card) border border-border bg-bg p-5 shadow-2xl shadow-black/50">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="min-w-0 truncate font-semibold">{title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-muted transition hover:bg-surface-2 hover:text-text"
              >
                ✕
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Header refresh control for a modal. Wraps `onRefresh` in the caller's pending
 * state: shows a spinning icon and disables while pending.
 */
export function ModalRefreshButton({
  onRefresh,
  pending,
}: {
  onRefresh: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={pending}
      aria-label="Actualizar"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-(--radius-button) border border-border px-2.5 py-1 text-xs font-medium text-muted transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <IconRefresh className={cn("h-4 w-4", pending && "animate-spin")} />
      Actualizar
    </button>
  );
}
