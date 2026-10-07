// BB's Button, adapted from shared-ui at 1e2cee69ad: the same base and variant classes, without cva, Radix Slot, or
// tailwind-merge, which this plugin doesn't depend on. Each size carries its own text, gap, and icon size so the
// joined classes never conflict.
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cx } from "../lib/cx";

const CONTROL_HOVER_TRANSITION = "transition-colors duration-150 hover:duration-0";

const BASE = `inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium ${CONTROL_HOVER_TRANSITION} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_[data-icon-root]]:pointer-events-none [&_[data-icon-root]]:shrink-0`;

const VARIANTS = {
  default: "bg-foreground text-background hover:bg-foreground/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-transparent hover:bg-state-hover hover:text-foreground",
  ghost:
    "hover:bg-state-hover hover:text-foreground aria-pressed:bg-state-active aria-pressed:text-foreground aria-pressed:hover:bg-state-active data-[state=open]:bg-state-active data-[state=open]:text-foreground data-[state=open]:hover:bg-state-active",
} as const;

const SIZES = {
  default: "h-9 gap-2 px-4 py-2 text-sm [&_[data-icon-root]]:size-4",
  sm: "h-8 gap-2 px-3 text-xs [&_[data-icon-root]]:size-4",
  /** The 28px row control the right panel uses (bb's compact icon-button height). */
  xs: "h-7 gap-1.5 px-2.5 text-xs [&_[data-icon-root]]:size-3.5",
  /** bb's 28px header icon button. */
  icon: "h-7 w-7 p-0 text-sm [&_[data-icon-root]]:size-4",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />
  ),
);
Button.displayName = "Button";

/** bb's keyboard-hint chip. */
export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-4 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10.5px] leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}
