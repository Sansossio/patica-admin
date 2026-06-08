"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "@/lib/button";
import { cn } from "@/lib/cn";

export function SubmitButton({
  children,
  variant = "primary",
  className,
  confirm,
  pendingLabel = "Procesando…",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  confirm?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={
        confirm
          ? (e) => {
              if (!window.confirm(confirm)) e.preventDefault();
            }
          : undefined
      }
      className={cn(buttonClass(variant), className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
