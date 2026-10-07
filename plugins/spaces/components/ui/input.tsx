// BB's Input, adapted from shared-ui at 1e2cee69ad with plugin-local sizes instead of tailwind-merge overrides.
import { forwardRef, type InputHTMLAttributes } from "react";

import { cx } from "../lib/cx";

const BASE =
  "flex w-full min-w-0 rounded-md border border-input bg-transparent transition-colors duration-150 hover:duration-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SIZES = {
  default: "h-9 px-3 py-1 text-sm",
  sm: "h-7 px-2 py-0.5 text-sm",
} as const;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: keyof typeof SIZES;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = "default", className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} autoComplete="off" className={cx(BASE, SIZES[inputSize], className)} {...props} />
  ),
);
Input.displayName = "Input";
