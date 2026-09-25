import type { ComponentType } from "react";
import {
  BubbleChatAddIcon,
  Cancel01Icon,
  CollapseIcon,
  ComputerDesk01Icon,
  CubeIcon,
  DashboardSquare01Icon,
  ExpandIcon,
  Delete02Icon,
  FlashIcon,
  FolderAddIcon,
  GridViewIcon,
  HierarchySquare01Icon,
  LaptopIcon,
  LinkSquare02Icon,
  ListViewIcon,
  Mic01Icon,
  MinusSignIcon,
  NextIcon,
  PlayIcon,
  PreviousIcon,
  PuzzleIcon,
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

const ICON = {
  outline: "oklch(0.42 0.04 225)",
  shadow: "oklch(0.25 0.03 250 / 0.28)",
  binLight: "oklch(0.95 0.02 195)",
  binMid: "oklch(0.86 0.035 200)",
  binDark: "oklch(0.7 0.045 215)",
  binInside: "oklch(0.5 0.035 220)",
  binRim: "oklch(0.98 0.01 200)",
  recycle: "oklch(0.64 0.17 145)",
  recycleEdge: "oklch(0.45 0.13 145)",
  paperShade: "oklch(0.8 0.012 250)",
  paperEdge: "oklch(0.55 0.02 240)",
} as const;

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
export const MicGlyph = bbGlyph(Mic01Icon);
export const ShowDesktopGlyph = bbGlyph(ComputerDesk01Icon);
export const PluginsGlyph = bbGlyph(PuzzleIcon);
export const SkillsGlyph = bbGlyph(FlashIcon);
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
      style={{ flex: "none", opacity: archived ? 0.55 : 1 }}
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


function RecycleArrow() {
  return (
    <>
      <path d="M24.9 21.6 28.1 27.1" stroke={ICON.recycle} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26.3 28.4 30.1 26.3 29.6 30.7Z" fill={ICON.recycle} stroke={ICON.recycleEdge} strokeWidth="0.5" strokeLinejoin="round" />
    </>
  );
}

export function RecycleBinArt({ size = 40, full = false }: { size?: number; full?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: "none" }} aria-hidden>
      <defs>
        <linearGradient id="bbd-bin-body" x1="0" y1="0" x2="1" y2="0.25">
          <stop offset="0" stopColor={ICON.binLight} />
          <stop offset="0.45" stopColor={ICON.binMid} />
          <stop offset="1" stopColor={ICON.binDark} />
        </linearGradient>
        <linearGradient id="bbd-bin-inside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ICON.binInside} />
          <stop offset="1" stopColor={ICON.binDark} />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="12" ry="2.4" fill={ICON.shadow} />
      <ellipse cx="24" cy="11" rx="15" ry="4.6" fill="url(#bbd-bin-inside)" />
      {full ? (
        <g stroke={ICON.paperEdge} strokeWidth="0.6" strokeLinejoin="round">
          <path d="M14.5 12 15.4 7.6 17.8 8.4 18.6 5.2 22 6.4 21.2 9.4 22.6 12.6Z" fill={PAPER} />
          <path d="M17.6 9.2 19.8 7.4M16.4 10.8 19 11.4" fill="none" stroke={ICON.paperShade} strokeWidth="0.7" />
          <path d="M20.6 12.8 21.8 6.2 24.6 7.4 26 3.6 29.8 5.4 29 8.6 31.8 9.2 30.6 13Z" fill={PAPER} />
          <path d="M23.4 9.4 26.6 7.2 28.4 10.2M22.8 11.6 26 12.2" fill="none" stroke={ICON.paperShade} strokeWidth="0.7" />
          <path d="M29.4 12.8 30.4 9.2 33 8.4 34.4 10.4 33.6 13Z" fill="oklch(0.93 0.09 95)" />
        </g>
      ) : null}
      <path d="M9 11 14.2 40.6A9.8 2.8 0 0 0 33.8 40.6L39 11A15 4.6 0 0 1 9 11Z" fill="url(#bbd-bin-body)" stroke={ICON.outline} strokeLinejoin="round" />
      <path d="M13.5 15.2 17.4 41.8M19.2 15.6 21 42.6M28.8 15.6 27 42.6M34.5 15.2 30.6 41.8" stroke={ICON.binRim} strokeOpacity="0.55" strokeWidth="1.1" />
      <path d="M16.3 15.5 19.2 42.3M24 15.8V42.9M31.7 15.5 28.8 42.3" stroke={ICON.binDark} strokeOpacity="0.35" strokeWidth="0.8" />
      <path d="M9 11A15 4.6 0 0 0 39 11" fill="none" stroke={ICON.binRim} strokeWidth="1.6" />
      <ellipse cx="24" cy="11" rx="15" ry="4.6" fill="none" stroke={ICON.outline} />
      <g transform="translate(0 2)">
        <RecycleArrow />
        <g transform="rotate(120 24 27)">
          <RecycleArrow />
        </g>
        <g transform="rotate(240 24 27)">
          <RecycleArrow />
        </g>
      </g>
    </svg>
  );
}

export type StatusKind = "attention" | "working" | "error" | "unread" | "archived" | "idle";

export function WarningArt({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: "none" }} aria-hidden>
      <path d="M8 1.2 15.2 14.3H.8Z" fill="oklch(0.84 0.17 90)" stroke="oklch(0.5 0.1 80)" strokeLinejoin="round" />
      <path d="M8 5.4v4.6M8 11.6v1.1" stroke="oklch(0.2 0.03 80)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function StatusIcon({ kind, size = 14 }: { kind: StatusKind; size?: number }) {
  const box = { width: size, height: size, flex: "none" } as const;
  switch (kind) {
    case "attention":
      return <WarningArt size={size} />;
    case "working":
      return (
        <svg viewBox="0 0 16 16" style={box} className="bbd-hourglass" aria-hidden>
          <path d="M3.5 1.5h9M3.5 14.5h9" stroke="oklch(0.45 0.08 60)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M4.5 1.5C4.5 5.5 7.3 6.6 7.3 8S4.5 10.5 4.5 14.5h7c0-4-2.8-5.1-2.8-6.5s2.8-2.5 2.8-6.5Z" fill="oklch(0.95 0.03 230)" stroke="oklch(0.45 0.08 60)" strokeLinejoin="round" />
          <path d="M5.6 13.6c.4-2 1.4-2.8 2.4-2.8s2 .8 2.4 2.8ZM6.2 4h3.6C9.4 5.5 8.6 6.2 8 6.6 7.4 6.2 6.6 5.5 6.2 4Z" fill="oklch(0.8 0.13 80)" />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 16 16" style={box} aria-hidden>
          <circle cx="8" cy="8" r="7" fill="oklch(0.58 0.21 27)" stroke="oklch(0.42 0.16 27)" />
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--bbd-white)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "unread":
      return (
        <svg viewBox="0 0 16 16" style={box} aria-hidden>
          <rect x="1.5" y="3.5" width="13" height="9.5" rx="1.2" fill="var(--bbd-white)" stroke="var(--bbd-blue-deep)" />
          <path d="M2 4.2 8 9l6-4.8" fill="none" stroke="var(--bbd-blue)" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "archived":
      return <RecycleBinArt size={size} />;
    case "idle":
      return <span style={box} aria-hidden />;
  }
}
