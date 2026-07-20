import * as React from "react";

import { cx } from "./foundation.js";
import { AtlasIcon } from "./icons.js";

export type IdentityTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? "")
    .join("") || "?";
}

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  src?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "away" | "busy" | "offline";
  statusLabel?: string;
}

export function Avatar({
  name,
  src,
  initials = initialsFor(name),
  size = "md",
  status,
  statusLabel,
  className,
  ...props
}: AvatarProps) {
  const resolvedStatusLabel = statusLabel ?? (status ? `${name} is ${status}` : undefined);
  return (
    <span
      className={cx("atlas-avatar", className)}
      data-size={size}
      role="img"
      aria-label={resolvedStatusLabel ?? name}
      {...props}
    >
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">{initials}</span>}
      {status ? (
        <span className="atlas-avatar__status" data-status={status} aria-hidden="true" />
      ) : null}
    </span>
  );
}

export interface AvatarGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  people: readonly Omit<AvatarProps, "size">[];
  label: string;
  max?: number;
  size?: AvatarProps["size"];
}

export function AvatarGroup({
  people,
  label,
  max = 4,
  size = "sm",
  className,
  ...props
}: AvatarGroupProps) {
  const visible = people.slice(0, Math.max(1, max));
  const overflow = Math.max(0, people.length - visible.length);
  return (
    <div
      className={cx("atlas-avatar-group", className)}
      aria-label={label}
      {...props}
    >
      {visible.map((person) => (
        <Avatar key={person.name} {...person} size={size} />
      ))}
      {overflow > 0 ? (
        <span className="atlas-avatar-group__overflow" aria-label={`${overflow} more people`}>
          <span aria-hidden="true">+{overflow}</span>
        </span>
      ) : null}
    </div>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: IdentityTone;
}

/** A short, system-authored status or descriptor. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span className={cx("atlas-badge", className)} data-tone={tone} {...props} />
  );
}

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

/** Passive metadata; optional removal is reserved for editing the object's labels. */
export function Tag({
  children,
  onRemove,
  removeLabel = "Remove tag",
  className,
  ...props
}: TagProps) {
  return (
    <span className={cx("atlas-tag", className)} {...props}>
      <span className="atlas-tag__label">{children}</span>
      {onRemove ? (
        <button
          type="button"
          className="atlas-tag__remove"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <AtlasIcon name="X" size="xs" />
        </button>
      ) : null}
    </span>
  );
}

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: React.ReactNode;
  selected?: boolean;
  leading?: React.ReactNode;
}

/** A compact interactive filter or choice; selected state is always exposed. */
export function Chip({
  children,
  selected = false,
  leading,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cx("atlas-chip", className)}
      aria-pressed={selected}
      data-selected={selected || undefined}
      {...props}
    >
      {leading ? <span className="atlas-chip__leading">{leading}</span> : null}
      <span>{children}</span>
    </button>
  );
}
