import type { ComponentType } from "react";
import {
  BubbleChatAddIcon,
  Cancel01Icon,
  CollapseIcon,
  CubeIcon,
  DashboardSquare01Icon,
  ExpandIcon,
  Delete02Icon,
  FolderAddIcon,
  GridViewIcon,
  HierarchySquare01Icon,
  LaptopIcon,
  LinkSquare02Icon,
  ListViewIcon,
  MinusSignIcon,
  NextIcon,
  PlayIcon,
  PreviousIcon,
  StickyNote03Icon,
  PowerIcon,
  StopIcon,
  PinIcon,
  SidebarRightIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import type { DesktopGroup } from "./core";

const FOLDER_BACK = "oklch(0.8 0.13 80)";
const FOLDER_FRONT_TOP = "oklch(0.93 0.11 92)";
const FOLDER_FRONT_BOTTOM = "oklch(0.82 0.14 82)";
const FOLDER_EDGE = "oklch(0.6 0.12 70)";
const PAPER = "oklch(0.98 0.005 250)";

function bbGlyph(icon: IconSvgElement) {
  return function BbGlyph({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
    return <HugeiconsIcon icon={icon} className={className} strokeWidth={strokeWidth} aria-hidden />;
  };
}

export const NewThreadGlyph = bbGlyph(BubbleChatAddIcon);
export const GridViewGlyph = bbGlyph(GridViewIcon);
export const ListViewGlyph = bbGlyph(ListViewIcon);
export const ProjectGlyph = bbGlyph(CubeIcon);
export const MachineGlyph = bbGlyph(LaptopIcon);
export const PinGlyph = bbGlyph(PinIcon);
export const CheckGlyph = bbGlyph(Tick02Icon);
export const ExternalLinkGlyph = bbGlyph(LinkSquare02Icon);
export const FolderPlusGlyph = bbGlyph(FolderAddIcon);
export const TileGlyph = bbGlyph(DashboardSquare01Icon);
export const ThreadsGlyph = bbGlyph(HierarchySquare01Icon);
export const PanelRightGlyph = bbGlyph(SidebarRightIcon);
export const TrashGlyph = bbGlyph(Delete02Icon);
export const MinusGlyph = bbGlyph(MinusSignIcon);
export const MaximizeGlyph = bbGlyph(ExpandIcon);
export const RestoreGlyph = bbGlyph(CollapseIcon);
export const CloseGlyph = bbGlyph(Cancel01Icon);
export const PlayGlyph = bbGlyph(PlayIcon);
export const StopGlyph = bbGlyph(StopIcon);
export const PowerGlyph = bbGlyph(PowerIcon);
export const StickyNoteGlyph = bbGlyph(StickyNote03Icon);
export const NextGlyph = bbGlyph(NextIcon);
export const PreviousGlyph = bbGlyph(PreviousIcon);

export function FolderArt({
  kind,
  size = 40,
  empty = false,
}: {
  kind: DesktopGroup["kind"];
  size?: number;
  empty?: boolean;
}) {
  const gradientId = `bbd-folder-${kind}`;
  const Badge = kind === "project" ? ProjectGlyph : kind === "machine" ? MachineGlyph : kind === "folder" ? PinGlyph : null;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 34" width={size} height={size * 0.85} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={FOLDER_FRONT_TOP} />
            <stop offset="1" stopColor={FOLDER_FRONT_BOTTOM} />
          </linearGradient>
        </defs>
        <path d="M3 5.5h12l3 3.5h18a1.5 1.5 0 0 1 1.5 1.5v19H3z" fill={FOLDER_BACK} stroke={FOLDER_EDGE} strokeLinejoin="round" />
        {empty ? null : (
          <>
            <rect x="8" y="7" width="26" height="14" rx="1" fill={PAPER} stroke={FOLDER_EDGE} strokeWidth="0.5" transform="rotate(4 21 14)" />
            <rect x="6" y="8.5" width="27" height="14" rx="1" fill={PAPER} stroke={FOLDER_EDGE} strokeWidth="0.5" />
          </>
        )}
        <path d="M2 13.5h36l-2.5 17H4.5z" fill={`url(#${gradientId})`} stroke={FOLDER_EDGE} strokeLinejoin="round" />
        <path d="M3.4 14.6h33.2" stroke={PAPER} strokeOpacity="0.8" />
      </svg>
      {Badge === null ? null : (
        <span
          className="absolute right-0 bottom-0 grid size-4 place-items-center rounded-sm"
          style={{
            background: "linear-gradient(180deg, var(--bbd-blue-bright), var(--bbd-blue))",
            boxShadow: "0 0 0 1px var(--bbd-white)",
            color: "var(--bbd-white)",
          }}
        >
          <Badge className="size-2.5" strokeWidth={2.25} />
        </span>
      )}
    </span>
  );
}

export function ThreadArt({
  size = 36,
  archived = false,
}: {
  size?: number;
  archived?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 36 32"
      width={size}
      height={size * 0.9}
      aria-hidden
      style={{ opacity: archived ? 0.55 : 1 }}
    >
      <rect x="1.5" y="1.5" width="33" height="29" rx="3" fill={PAPER} stroke="var(--bbd-blue-deep)" />
      <path d="M1.5 4.5a3 3 0 0 1 3-3h27a3 3 0 0 1 3 3V8h-33z" fill="var(--bbd-blue)" />
      <rect x="29" y="3" width="3.5" height="3.5" rx="0.8" fill="var(--bbd-close)" />
      <rect x="6" y="12" width="17" height="3" rx="1.5" fill="oklch(0.75 0.02 250)" />
      <rect x="13" y="18" width="17" height="3" rx="1.5" fill="var(--bbd-blue-sky)" />
      <rect x="6" y="24" width="12" height="3" rx="1.5" fill="oklch(0.75 0.02 250)" />
    </svg>
  );
}

export function GlyphTile({
  glyph: Glyph,
  size = 40,
  tone = "blue",
}: {
  glyph: ComponentType<{ className?: string; strokeWidth?: number }>;
  size?: number;
  tone?: "blue" | "green";
}) {
  const [light, base, deep] =
    tone === "green"
      ? ["color-mix(in oklch, var(--bbd-green) 60%, var(--bbd-white) 40%)", "var(--bbd-green)", "var(--bbd-green-deep)"]
      : ["var(--bbd-blue-bright)", "var(--bbd-blue)", "var(--bbd-blue-deep)"];
  return (
    <span
      className="inline-grid place-items-center rounded-md"
      style={{
        width: size - 4,
        height: size - 4,
        background: `radial-gradient(90% 90% at 30% 25%, ${light}, ${base} 70%, ${deep})`,
        boxShadow: "0 0 0 1.5px var(--bbd-white), 0 2px 4px oklch(0.2 0.05 260 / 0.4)",
        color: "var(--bbd-white)",
      }}
      aria-hidden
    >
      <Glyph className="size-[55%]" strokeWidth={2} />
    </span>
  );
}

export function StickyNoteArt({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M7 6 H33 V25 L25 34 H7 Z" fill="oklch(0.9 0.14 95)" stroke="oklch(0.62 0.12 80)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M33 25 H26.5 Q25 25 25 26.5 V34 Z" fill="oklch(0.78 0.14 88)" stroke="oklch(0.62 0.12 80)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 13 H28 M12 18.5 H28 M12 24 H20" stroke="oklch(0.62 0.12 80)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MediaPlayerArt({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="var(--bbd-orange)" />
      <circle cx="20" cy="20" r="14" fill="var(--bbd-blue)" />
      <path d="M16.5 13.8 Q16.5 12.6 17.6 13.2 L26.4 18.9 Q27.4 19.6 26.4 20.3 L17.6 26.8 Q16.5 27.4 16.5 26.2 Z" fill={PAPER} />
    </svg>
  );
}

export function RecycleBinArt({ size = 40, full = false }: { size?: number; full?: boolean }) {
  const glass = "oklch(0.88 0.04 230)";
  const glassDeep = "oklch(0.74 0.06 235)";
  const edge = "oklch(0.52 0.07 240)";
  const arrows = "oklch(0.62 0.17 145)";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="bbd-bin-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={glassDeep} />
          <stop offset="0.45" stopColor={glass} />
          <stop offset="1" stopColor={glassDeep} />
        </linearGradient>
      </defs>
      {full ? (
        <>
          <path d="M11 11.5 L14 5.5 L19.5 7.5 L18 12 Z" fill={PAPER} stroke={edge} strokeWidth="0.75" strokeLinejoin="round" />
          <path d="M18 11 L22.5 4.5 L28.5 8 L25.5 12.5 Z" fill={PAPER} stroke={edge} strokeWidth="0.75" strokeLinejoin="round" />
          <path d="M24.5 12 L28 7.5 L31 11 Z" fill="oklch(0.9 0.1 95)" stroke={edge} strokeWidth="0.75" strokeLinejoin="round" />
        </>
      ) : null}
      <path d="M8 12 H32 L29.5 36 Q29.3 37 28.3 37 H11.7 Q10.7 37 10.5 36 Z" fill="url(#bbd-bin-body)" stroke={edge} strokeLinejoin="round" />
      <path d="M14 14.5 L15 34.5 M20 14.5 V34.5 M26 14.5 L25 34.5" stroke={PAPER} strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="20" cy="12" rx="12.5" ry="2.6" fill={glass} stroke={edge} />
      <path d="M16.5 26.5 A4 4 0 0 1 20.8 21.3 M23.6 24 A4 4 0 0 1 19.6 29.2" fill="none" stroke={arrows} strokeWidth="2" strokeLinecap="round" />
      <path d="M20.2 19.6 L22.4 21.5 L19.8 22.7 Z M20.2 30.9 L17.9 29 L20.5 27.8 Z" fill={arrows} />
    </svg>
  );
}
