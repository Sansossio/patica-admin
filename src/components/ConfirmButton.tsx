"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Modal } from "./Modal";
import { buttonClass, type ButtonVariant } from "@/lib/button";

/**
 * Trigger button that asks for confirmation in a custom Modal (no native
 * window.confirm), then runs a server action without a full page reload. The
 * action is invoked inside a transition with a FormData built from `fields`;
 * its `revalidatePath` soft-refreshes the affected routes.
 */
export function ConfirmButton({
  action,
  fields,
  children,
  variant = "primary",
  title,
  message,
  confirmLabel = "Confirmar",
  confirmVariant,
  pendingLabel = "Procesando…",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  /** Trigger button content. */
  children: ReactNode;
  variant?: ButtonVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  pendingLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onConfirm = () => {
    const fd = new FormData();
    if (fields) for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    startTransition(async () => {
      await action(fd);
      setOpen(false);
    });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass(variant)}>
        {children}
      </button>

      <Modal open={open} onClose={() => !pending && setOpen(false)} title={title}>
        <p className="text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className={buttonClass("ghost")}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={buttonClass(confirmVariant ?? variant)}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
