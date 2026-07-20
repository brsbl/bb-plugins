import * as React from "react";

import { cx, VisuallyHidden } from "./foundation.js";

export type ControlTone = "neutral" | "primary" | "danger" | "quiet";
export type ControlSize = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ControlTone;
  size?: ControlSize;
  busy?: boolean;
  busyLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      tone = "neutral",
      size = "md",
      busy = false,
      busyLabel = "Working",
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cx("atlas-button", className)}
      data-tone={tone}
      data-size={size}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? (
        <>
          <SpinnerGlyph />
          <VisuallyHidden>{busyLabel}: </VisuallyHidden>
        </>
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export interface IconButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children"
  > {
  label: string;
  children: React.ReactNode;
  tone?: ControlTone;
  size?: ControlSize;
}

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  IconButtonProps
>(
  (
    {
      label,
      children,
      className,
      tone = "quiet",
      size = "md",
      title,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cx("atlas-icon-button", className)}
      data-tone={tone}
      data-size={size}
      aria-label={label}
      title={title}
      {...props}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = "IconButton";

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cx("atlas-input", className)}
    {...props}
  />
));
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 3, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cx("atlas-input atlas-textarea", className)}
    {...props}
  />
));
TextArea.displayName = "TextArea";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cx("atlas-input atlas-select", className)}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cx("atlas-checkbox", className)}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export const Switch = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "role">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    role="switch"
    className={cx("atlas-switch", className)}
    {...props}
  />
));
Switch.displayName = "Switch";

export function SpinnerGlyph() {
  return <span className="atlas-spinner-glyph" aria-hidden="true" />;
}
