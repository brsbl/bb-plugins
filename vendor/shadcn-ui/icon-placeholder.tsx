import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowDownIcon,
  ArrowLeft01Icon,
  ArrowLeftIcon,
  ArrowRight01Icon,
  ArrowRightIcon,
  ArrowUp01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MinusSignIcon,
  MoreHorizontalCircle01Icon,
  MultiplicationSignCircleIcon,
  SearchIcon,
  SidebarLeftIcon,
  SquareIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
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

export const SHADCN_HUGEICON_NAMES = [
  "Alert02Icon",
  "ArrowDown01Icon",
  "ArrowDown02Icon",
  "ArrowDownIcon",
  "ArrowLeft01Icon",
  "ArrowLeftIcon",
  "ArrowRight01Icon",
  "ArrowRightIcon",
  "ArrowUp01Icon",
  "Cancel01Icon",
  "CheckmarkCircle02Icon",
  "InformationCircleIcon",
  "Loading03Icon",
  "MinusSignIcon",
  "MoreHorizontalCircle01Icon",
  "MultiplicationSignCircleIcon",
  "SearchIcon",
  "SidebarLeftIcon",
  "Tick02Icon",
  "UnfoldMoreIcon",
] as const;

const ICONS: Record<
  (typeof SHADCN_HUGEICON_NAMES)[number],
  IconSvgElement
> = {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowDownIcon,
  ArrowLeft01Icon,
  ArrowLeftIcon,
  ArrowRight01Icon,
  ArrowRightIcon,
  ArrowUp01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MinusSignIcon,
  MoreHorizontalCircle01Icon,
  MultiplicationSignCircleIcon,
  SearchIcon,
  SidebarLeftIcon,
  Tick02Icon,
  UnfoldMoreIcon,
};

function isCuratedIconName(
  value: string,
): value is (typeof SHADCN_HUGEICON_NAMES)[number] {
  return Object.hasOwn(ICONS, value);
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
  const candidate =
    hugeiconsName && isCuratedIconName(hugeiconsName)
      ? ICONS[hugeiconsName]
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
