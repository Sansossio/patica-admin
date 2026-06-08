import { cn } from "./cn";

export const BUTTON_VARIANTS = {
  primary: "bg-primary text-zinc-950 hover:bg-primary-dark",
  danger: "bg-danger/90 text-zinc-950 hover:bg-danger",
  success: "bg-success/90 text-zinc-950 hover:bg-success",
  ghost: "border border-border text-text hover:border-primary/60 hover:text-primary",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary", extra?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-(--radius-button) px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    BUTTON_VARIANTS[variant],
    extra,
  );
}
