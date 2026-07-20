import * as hugeicons from "@hugeicons/core-free-icons";
import { SquareIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ComponentProps } from "react";

type UpstreamIconNames = {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
};

function isIconSvgElement(value: unknown): value is IconSvgElement {
  return Array.isArray(value);
}

/** Resolves the Hugeicons name already carried by the pinned shadcn source. */
export function IconPlaceholder({
  hugeicons: hugeiconsName,
  lucide: _lucide,
  tabler: _tabler,
  phosphor: _phosphor,
  remixicon: _remixicon,
  strokeWidth,
  ...props
}: UpstreamIconNames &
  Omit<ComponentProps<"svg">, keyof UpstreamIconNames>) {
  const candidate = hugeiconsName
    ? (hugeicons as Readonly<Record<string, unknown>>)[hugeiconsName]
    : undefined;
  return (
    <HugeiconsIcon
      icon={isIconSvgElement(candidate) ? candidate : SquareIcon}
      strokeWidth={
        typeof strokeWidth === "string" ? Number(strokeWidth) : strokeWidth
      }
      {...props}
    />
  );
}
