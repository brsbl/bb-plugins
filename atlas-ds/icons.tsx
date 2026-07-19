import * as React from "react";

import {
  Icon as HostIcon,
  type IconName,
} from "../components/ui/icon.js";
import { cx } from "./foundation.js";

export interface AtlasIconProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  name: IconName;
  size?: "xs" | "sm" | "md";
  label?: string;
}

/**
 * The single icon boundary for Atlas-authored components. It deliberately
 * consumes bb's vendored Hugeicons set so previews never fall back to text
 * symbols, emoji, or handcrafted SVG artwork.
 */
export function AtlasIcon({
  name,
  size = "sm",
  label,
  className,
  ...props
}: AtlasIconProps) {
  return (
    <span
      className={cx("atlas-icon", className)}
      data-size={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <HostIcon name={name} aria-hidden="true" />
    </span>
  );
}

export type { IconName as AtlasIconName };
