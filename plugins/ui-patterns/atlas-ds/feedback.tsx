import * as React from "react";

import { IconButton, SpinnerGlyph } from "./controls.js";
import { Cluster, cx, Stack, Text } from "./foundation.js";
import { AtlasIcon } from "./icons.js";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusBadge({
  tone = "neutral",
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cx("atlas-status-badge", className)}
      data-tone={tone}
      {...props}
    />
  );
}

export interface InlineAlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: Exclude<StatusTone, "neutral">;
  title: React.ReactNode;
  assertive?: boolean;
  actions?: React.ReactNode;
}

export function InlineAlert({
  tone = "info",
  title,
  assertive = false,
  actions,
  children,
  className,
  ...props
}: InlineAlertProps) {
  return (
    <div
      className={cx("atlas-alert", className)}
      data-tone={tone}
      role={assertive ? "alert" : "status"}
      {...props}
    >
      <span className="atlas-alert__mark" aria-hidden="true" />
      <Stack gap="xs">
        <strong className="atlas-alert__title">{title}</strong>
        {children ? <Text tone="muted">{children}</Text> : null}
        {actions ? <Cluster gap="sm">{actions}</Cluster> : null}
      </Stack>
    </div>
  );
}

export interface ProgressBarProps
  extends Omit<
    React.ProgressHTMLAttributes<HTMLProgressElement>,
    "children" | "aria-label"
  > {
  label: string;
  valueText?: string;
}

export function ProgressBar({
  label,
  valueText,
  className,
  max = 100,
  ...props
}: ProgressBarProps) {
  return (
    <div className={cx("atlas-progress", className)}>
      <Cluster justify="between" gap="sm">
        <label>{label}</label>
        {valueText ? <Text as="span" tone="muted">{valueText}</Text> : null}
      </Cluster>
      <progress aria-label={label} max={max} {...props} />
    </div>
  );
}

export interface LoadingStatusProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function LoadingStatus({
  label,
  className,
  ...props
}: LoadingStatusProps) {
  return (
    <div
      className={cx("atlas-loading-status", className)}
      role="status"
      {...props}
    >
      <SpinnerGlyph />
      <span>{label}</span>
    </div>
  );
}

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  shape?: "text" | "block" | "circle";
  width?: React.CSSProperties["width"];
  height?: React.CSSProperties["height"];
  animated?: boolean;
}

/**
 * A structural loading placeholder. Keep the loading label and `aria-busy`
 * on the region that owns it; the visual placeholder itself is decorative.
 */
export function Skeleton({
  shape = "text",
  width,
  height,
  animated = true,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cx("atlas-skeleton", className)}
      data-shape={shape}
      data-animated={animated || undefined}
      aria-hidden="true"
      style={{ ...style, width, height }}
      {...props}
    />
  );
}

export interface ToastRecord {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: StatusTone;
}

export interface ToastRegionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  toasts: readonly ToastRecord[];
  onDismiss?: (id: string) => void;
}

export function ToastRegion({
  label = "Notifications",
  toasts,
  onDismiss,
  className,
  ...props
}: ToastRegionProps) {
  return (
    <div
      className={cx("atlas-toast-region", className)}
      aria-label={label}
      aria-live="polite"
      {...props}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="atlas-toast"
          data-tone={toast.tone ?? "neutral"}
          role="status"
        >
          <Stack gap="xs">
            <strong>{toast.title}</strong>
            {toast.description ? (
              <Text tone="muted">{toast.description}</Text>
            ) : null}
          </Stack>
          {onDismiss ? (
            <IconButton
              label="Dismiss notification"
              size="sm"
              onClick={() => onDismiss(toast.id)}
            >
              <AtlasIcon name="X" size="xs" />
            </IconButton>
          ) : null}
        </div>
      ))}
    </div>
  );
}
