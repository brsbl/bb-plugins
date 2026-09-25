import type { ReactNode } from "react";
import {
  BubbleChatAddIcon,
  Cancel01Icon,
  ArrowRightDoubleIcon,
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
  Mic01Icon,
  MinusSignIcon,
  NextIcon,
  PlayIcon,
  PreviousIcon,
  Notebook01Icon,
  PowerIcon,
  StopIcon,
  PinIcon,
  SidebarRightIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import type { DesktopGroup } from "./core";

const PAPER = "oklch(0.98 0.005 250)";

const ICON = {
  shadow: "oklch(0.2 0.03 260)",
  blueOutline: "oklch(0.42 0.15 258)",
  bubbleTop: "oklch(0.995 0.003 240)",
  bubbleBottom: "oklch(0.88 0.03 245)",
  bubbleEdge: "oklch(0.55 0.06 250)",
  dot: "oklch(0.5 0.2 262)",
  sparkRay: "oklch(0.62 0.21 33)",
  sparkCore: "oklch(0.9 0.16 95)",
  sparkEdge: "oklch(0.52 0.17 40)",
  folderBack: "oklch(0.85 0.12 88)",
  folderFrontTop: "oklch(0.97 0.08 98)",
  folderFrontBottom: "oklch(0.86 0.13 86)",
  folderEdge: "oklch(0.62 0.12 75)",
  navyTop: "oklch(0.5 0.17 262)",
  navyBottom: "oklch(0.32 0.14 265)",
  navyEdge: "oklch(0.24 0.1 265)",
  cream: "oklch(0.97 0.02 95)",
  creamShade: "oklch(0.9 0.03 90)",
  pencil: "oklch(0.58 0.17 255)",
  pencilDark: "oklch(0.4 0.14 258)",
  eraser: "oklch(0.64 0.19 35)",
  wood: "oklch(0.88 0.06 75)",
  lead: "oklch(0.3 0.02 260)",
  glassTop: "oklch(0.97 0.025 215)",
  glassMid: "oklch(0.88 0.06 230)",
  glassBottom: "oklch(0.76 0.1 245)",
  glassEdge: "oklch(0.55 0.13 250)",
  recycleLight: "oklch(0.72 0.19 142)",
  recycle: "oklch(0.52 0.17 145)",
  recycleEdge: "oklch(0.38 0.12 145)",
  paper: "oklch(0.99 0.005 250)",
  paperShade: "oklch(0.85 0.012 250)",
  paperEdge: "oklch(0.6 0.02 245)",
  noteTop: "oklch(0.97 0.14 102)",
  noteBottom: "oklch(0.86 0.16 88)",
  noteEdge: "oklch(0.65 0.14 75)",
  noteDot: "oklch(0.6 0.21 28)",
  boxTop: "oklch(0.78 0.11 250)",
  boxFront: "oklch(0.55 0.18 258)",
  boxSide: "oklch(0.42 0.16 262)",
  discLight: "oklch(0.98 0.01 250)",
  discMid: "oklch(0.85 0.04 280)",
  discDark: "oklch(0.72 0.05 230)",
  discEdge: "oklch(0.55 0.03 250)",
  boltTop: "oklch(0.96 0.13 100)",
  boltBottom: "oklch(0.82 0.17 75)",
  boltEdge: "oklch(0.56 0.14 60)",
  titleTop: "oklch(0.72 0.14 250)",
  titleBottom: "oklch(0.52 0.21 260)",
  panel: "oklch(0.92 0.04 240)",
  line: "oklch(0.75 0.03 250)",
  metal: "oklch(0.8 0.02 250)",
  metalEdge: "oklch(0.5 0.03 250)",
  lensTop: "oklch(0.98 0.02 220)",
  notepadTop: "oklch(0.98 0.02 230)",
  notepadBottom: "oklch(0.9 0.05 235)",
  notepadLine: "oklch(0.75 0.14 145)",
  lensBottom: "oklch(0.78 0.08 235)",
  wmpOrange: "oklch(0.68 0.2 38)",
  wmpGreen: "oklch(0.72 0.19 138)",
  wmpBlue: "oklch(0.55 0.19 258)",
  wmpYellow: "oklch(0.85 0.17 88)",
  wmpRim: "oklch(0.28 0.08 265)",
  playTop: "oklch(0.68 0.16 250)",
  playBottom: "oklch(0.45 0.2 262)",
  redTop: "oklch(0.72 0.2 25)",
  redBottom: "oklch(0.5 0.21 27)",
  redEdge: "oklch(0.38 0.15 27)",
  warnTop: "oklch(0.95 0.15 98)",
  warnBottom: "oklch(0.8 0.17 80)",
  warnEdge: "oklch(0.45 0.08 260)",
  sand: "oklch(0.82 0.13 80)",
  frame: "oklch(0.45 0.08 60)",
  okTop: "oklch(0.8 0.18 140)",
  okBottom: "oklch(0.55 0.17 145)",
  okEdge: "oklch(0.4 0.12 145)",
} as const;

function gradient(id: string, from: string, to: string, x2 = 0.4, y2 = 1) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  );
}

function IconDefs() {
  return (
    <defs>
      <filter id="bbd-drop" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="1.2" dy="1.2" stdDeviation="0.9" floodColor={ICON.shadow} floodOpacity="0.55" />
      </filter>
      {gradient("bbd-g-bubble", ICON.bubbleTop, ICON.bubbleBottom)}
      {gradient("bbd-g-folder", ICON.folderFrontTop, ICON.folderFrontBottom, 0.2)}
      {gradient("bbd-g-navy", ICON.navyTop, ICON.navyBottom)}
      {gradient("bbd-g-cream", ICON.cream, ICON.creamShade)}
      {gradient("bbd-g-glass", ICON.glassTop, ICON.glassBottom, 1, 0.6)}
      {gradient("bbd-g-recycle", ICON.recycleLight, ICON.recycle)}
      {gradient("bbd-g-note", ICON.noteTop, ICON.noteBottom)}
      {gradient("bbd-g-box", ICON.boxTop, ICON.boxFront, 0, 1)}
      {gradient("bbd-g-bolt", ICON.boltTop, ICON.boltBottom)}
      {gradient("bbd-g-title", ICON.titleTop, ICON.titleBottom, 0, 1)}
      {gradient("bbd-g-play", ICON.playTop, ICON.playBottom)}
      {gradient("bbd-g-red", ICON.redTop, ICON.redBottom)}
      {gradient("bbd-g-ok", ICON.okTop, ICON.okBottom)}
      {gradient("bbd-g-lens", ICON.lensTop, ICON.lensBottom)}
      {gradient("bbd-g-notepad", ICON.notepadTop, ICON.notepadBottom)}
      {gradient("bbd-g-warn", ICON.warnTop, ICON.warnBottom, 0, 1)}
      <radialGradient id="bbd-g-disc" cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stopColor={ICON.discLight} />
        <stop offset="0.6" stopColor={ICON.discMid} />
        <stop offset="1" stopColor={ICON.discDark} />
      </radialGradient>
    </defs>
  );
}

function IconSvg({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: "none", overflow: "visible" }} aria-hidden>
      <IconDefs />
      <g filter="url(#bbd-drop)">{children}</g>
    </svg>
  );
}

function Sparkle({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {rays.map((angle) => (
        <path
          key={angle}
          d="M0 -5.2 1.6 -10.4 -1.6 -10.4Z"
          transform={`rotate(${angle})`}
          fill={ICON.sparkRay}
          stroke={ICON.sparkEdge}
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
      ))}
      <circle r="4.6" fill={ICON.sparkCore} stroke={ICON.sparkEdge} strokeWidth="0.8" />
      <circle cx="-1.3" cy="-1.3" r="1.5" fill={ICON.paper} opacity="0.8" />
    </g>
  );
}

function Pencil({ from, to }: { from: [number, number]; to: [number, number] }) {
  const angle = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return (
    <g transform={`translate(${from[0]} ${from[1]}) rotate(${angle})`}>
      <path d={`M0 0 6 -2.6V2.6Z`} fill={ICON.wood} stroke={ICON.pencilDark} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M0 0 2.2 -0.95V0.95Z" fill={ICON.lead} />
      <rect x="6" y="-2.6" width={length - 10} height="5.2" fill={ICON.pencil} stroke={ICON.pencilDark} strokeWidth="0.6" />
      <path d={`M6 -0.9H${length - 4}`} stroke={ICON.paper} strokeOpacity="0.55" strokeWidth="0.9" />
      <rect x={length - 4} y="-2.6" width="4" height="5.2" rx="1.4" fill={ICON.eraser} stroke={ICON.pencilDark} strokeWidth="0.6" />
    </g>
  );
}

function Bubble({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const r = Math.min(7, height / 2.4);
  return (
    <g>
      <path
        d={`M${x + r} ${y}h${width - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${height - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}H${x + width * 0.36}l-${width * 0.22} ${height * 0.34} ${width * 0.04}-${height * 0.34}H${x + r}a${r} ${r} 0 0 1 -${r} -${r}v-${height - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}Z`}
        fill="url(#bbd-g-bubble)"
        stroke={ICON.bubbleEdge}
        strokeLinejoin="round"
      />
      <path d={`M${x + r} ${y + 2.2}h${width - 2 * r - 2}`} stroke={ICON.paper} strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      {[0.3, 0.5, 0.7].map((fraction) => (
        <circle key={fraction} cx={x + width * fraction} cy={y + height / 2} r={Math.max(1.6, height / 9)} fill={ICON.dot} />
      ))}
    </g>
  );
}

function FolderShape({ children }: { children?: ReactNode }) {
  return (
    <>
      <path d="M4 12.5a2 2 0 0 1 2-2h11l3.2 3.5H40a2 2 0 0 1 2 2V38H4Z" fill={ICON.folderBack} stroke={ICON.folderEdge} strokeLinejoin="round" />
      {children}
      <path d="M2.5 20.5a1.5 1.5 0 0 1 1.5-1.5h38.6a1.3 1.3 0 0 1 1.3 1.5L41.5 38.8a1.5 1.5 0 0 1-1.5 1.2H6a1.5 1.5 0 0 1-1.5-1.3Z" fill="url(#bbd-g-folder)" stroke={ICON.folderEdge} strokeLinejoin="round" />
      <path d="M4.5 21h37.5" stroke={ICON.paper} strokeOpacity="0.85" strokeWidth="1.2" />
    </>
  );
}

function MiniWindow({ x, y, width, height, panel = false }: { x: number; y: number; width: number; height: number; panel?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="2.5" fill={ICON.paper} stroke={ICON.blueOutline} />
      <path d={`M${x} ${y + 2.5}a2.5 2.5 0 0 1 2.5-2.5h${width - 5}a2.5 2.5 0 0 1 2.5 2.5V${y + 6.5}H${x}Z`} fill="url(#bbd-g-title)" />
      <rect x={x + width - 5.5} y={y + 1.6} width="3.4" height="3.4" rx="0.8" fill={ICON.redTop} stroke={ICON.paper} strokeWidth="0.5" />
      {panel ? <rect x={x + width * 0.6} y={y + 7} width={width * 0.4 - 1} height={height - 8} fill={ICON.panel} /> : null}
      <path
        d={`M${x + 4} ${y + 12}h${width * 0.4}M${x + 4} ${y + 17}h${width * 0.28}M${x + 4} ${y + 22}h${width * 0.36}`}
        stroke={ICON.line}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function NewThreadArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <Bubble x={3} y={12} width={36} height={24} />
      <Sparkle x={37} y={12} scale={0.95} />
    </IconSvg>
  );
}

export function ThreadsArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <FolderShape>
        <g transform="rotate(-8 28 14)">
          <Bubble x={15} y={3} width={27} height={17} />
        </g>
      </FolderShape>
    </IconSvg>
  );
}

export function NewFolderArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <FolderShape />
      <Sparkle x={37} y={12} scale={0.95} />
    </IconSvg>
  );
}

export function ShowDesktopArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <g transform="rotate(-10 24 24)">
        <rect x="5" y="7" width="36" height="34" rx="3.5" fill="url(#bbd-g-navy)" stroke={ICON.navyEdge} />
        <path d="M9 11h28v26H9Z" fill="url(#bbd-g-cream)" stroke={ICON.navyEdge} strokeWidth="0.6" />
        <path d="M13 17h14M13 22h18M13 27h11" stroke={ICON.line} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M6.5 8.8h33" stroke={ICON.paper} strokeOpacity="0.45" strokeWidth="1.2" />
      </g>
      <Pencil from={[22, 34]} to={[45, 9]} />
    </IconSvg>
  );
}

export function PluginsArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M6 14 20 7 36 12 22 19Z" fill={ICON.boxTop} stroke={ICON.blueOutline} strokeLinejoin="round" />
      <path d="M6 14 22 19V41L6 35Z" fill="url(#bbd-g-box)" stroke={ICON.blueOutline} strokeLinejoin="round" />
      <path d="M22 19 36 12V34L22 41Z" fill={ICON.boxSide} stroke={ICON.blueOutline} strokeLinejoin="round" />
      <path d="M9 18.5 19 21.8" stroke={ICON.paper} strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="33" cy="32" r="11" fill="url(#bbd-g-disc)" stroke={ICON.discEdge} />
      <path d="M26 27a9 9 0 0 1 8-4" stroke={ICON.wmpGreen} strokeOpacity="0.55" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 36a9 9 0 0 1-6 5" stroke={ICON.wmpOrange} strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="32" r="3.4" fill={ICON.paper} stroke={ICON.discEdge} />
      <circle cx="33" cy="32" r="1.4" fill={ICON.discDark} />
    </IconSvg>
  );
}

export function SkillsArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M29 3 11 26h10.5L16 45l21-26H26.5L33 3Z" fill="url(#bbd-g-bolt)" stroke={ICON.boltEdge} strokeLinejoin="round" />
      <path d="M28.5 7 16.5 23" stroke={ICON.paper} strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" />
    </IconSvg>
  );
}

export function SearchArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M8.5 43.5 19.5 30" stroke={ICON.boltEdge} strokeWidth="7" strokeLinecap="round" />
      <path d="M8.5 43.5 19.5 30" stroke="url(#bbd-g-bolt)" strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="28" cy="20" r="14" fill={ICON.metal} stroke={ICON.metalEdge} />
      <circle cx="28" cy="20" r="11" fill="url(#bbd-g-lens)" stroke={ICON.metalEdge} strokeWidth="0.8" />
      <path d="M20.5 16a8.5 8.5 0 0 1 7-6" stroke={ICON.paper} strokeOpacity="0.9" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </IconSvg>
  );
}

export function RunArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M2 18h7M4 24h6M2 30h7" stroke={ICON.metal} strokeWidth="2" strokeLinecap="round" />
      <g transform="skewX(-8)">
        <rect x="15" y="11" width="31" height="24" rx="2.5" fill={ICON.cream} stroke={ICON.blueOutline} />
        <path d="M15 13.5a2.5 2.5 0 0 1 2.5-2.5h26a2.5 2.5 0 0 1 2.5 2.5V17H15Z" fill="url(#bbd-g-title)" />
        <rect x="40" y="12.4" width="3.4" height="3.4" rx="0.8" fill={ICON.redTop} stroke={ICON.paper} strokeWidth="0.5" />
        <rect x="19" y="22" width="23" height="7" rx="1" fill={ICON.paper} stroke={ICON.metalEdge} strokeWidth="0.8" />
        <path d="M22 23.8v3.4" stroke={ICON.lead} strokeWidth="1.2" />
      </g>
    </IconSvg>
  );
}

export function MinesweeperArt({ size = 40 }: { size?: number }) {
  const spikes = [0, 45, 90, 135];
  return (
    <IconSvg size={size}>
      <path d="M6 40 30 34 42 40 18 46Z" fill={ICON.metal} stroke={ICON.metalEdge} strokeLinejoin="round" />
      {spikes.map((angle) => (
        <path key={angle} d="M22 11V43M6 27H38" transform={`rotate(${angle} 22 27)`} stroke={ICON.lead} strokeWidth="2.6" strokeLinecap="round" />
      ))}
      <circle cx="22" cy="27" r="11" fill={ICON.lead} />
      <circle cx="18" cy="23" r="3.6" fill={ICON.paper} opacity="0.9" />
      <path d="M36 8V26" stroke={ICON.lead} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M36 8 45 12.5 36 17Z" fill={ICON.redTop} stroke={ICON.redEdge} strokeWidth="0.8" strokeLinejoin="round" />
    </IconSvg>
  );
}

const HEART =
  "M12 21.5C5 16 1.5 12.5 1.5 8c0-3.2 2.5-5.5 5.5-5.5 2.2 0 4 1.3 5 3.1 1-1.8 2.8-3.1 5-3.1 3 0 5.5 2.3 5.5 5.5 0 4.5-3.5 8-10.5 13.5Z";

const SPADE =
  "M12 1.5c4 5 10 8.5 10 13 0 3-2.2 5-4.8 5-1.8 0-3.4-.9-4.2-2.3.3 2.3 1.2 3.8 2.8 5.3H8.2c1.6-1.5 2.5-3 2.8-5.3-.8 1.4-2.4 2.3-4.2 2.3C4.2 19.5 2 17.5 2 14.5c0-4.5 6-8 10-13Z";

function PlayingCard({ symbol, fill, stroke, angle, x }: { symbol: string; fill: string; stroke?: string; angle: number; x: number }) {
  return (
    <g transform={`rotate(${angle} ${x + 11} 40)`}>
      <rect x={x} y={9} width={22} height={31} rx={2.6} fill="url(#bbd-g-bubble)" stroke={ICON.bubbleEdge} />
      <path d={symbol} fill={fill} stroke={stroke} strokeWidth={stroke === undefined ? 0 : 1.2} transform={`translate(${x + 5.5} 18) scale(0.46)`} />
      <path d={symbol} fill={fill} transform={`translate(${x + 2.4} 11.6) scale(0.2)`} />
      <path d={symbol} fill={fill} transform={`translate(${x + 19.6} 37.4) rotate(180) scale(0.2)`} />
    </g>
  );
}

export function SolitaireArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <PlayingCard symbol={SPADE} fill={ICON.lead} angle={-14} x={9} />
      <PlayingCard symbol={HEART} fill={ICON.redBottom} stroke={ICON.redEdge} angle={12} x={17} />
    </IconSvg>
  );
}

export function CommandPromptArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <rect x="3" y="8" width="42" height="32" rx="2.5" fill={ICON.lead} stroke={ICON.blueOutline} />
      <path d="M3 10.5A2.5 2.5 0 0 1 5.5 8h37a2.5 2.5 0 0 1 2.5 2.5V14H3Z" fill="url(#bbd-g-title)" />
      <rect x="39" y="9.4" width="3.8" height="3.4" rx="0.8" fill={ICON.redTop} stroke={ICON.paper} strokeWidth="0.5" />
      <path d="M12.5 22.5a4 4 0 1 0 0 7M19.5 21l5 11M28 32h9" fill="none" stroke={ICON.paper} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.2" cy="23.6" r="1.2" fill={ICON.paper} />
      <circle cx="16.2" cy="29.6" r="1.2" fill={ICON.paper} />
    </IconSvg>
  );
}

export function InternetExplorerArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M36.5 33.5A14 14 0 1 1 38 22H17.5" fill="none" stroke={ICON.blueOutline} strokeWidth="9" strokeLinecap="round" />
      <path d="M36.5 33.5A14 14 0 1 1 38 22H17.5" fill="none" stroke="url(#bbd-g-title)" strokeWidth="6.4" strokeLinecap="round" />
      <path d="M13.5 17.5a9.5 9.5 0 0 1 6-5" fill="none" stroke={ICON.paper} strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="24" cy="25" rx="22" ry="8.5" transform="rotate(-28 24 25)" fill="none" stroke={ICON.boltEdge} strokeWidth="3.6" />
      <ellipse cx="24" cy="25" rx="22" ry="8.5" transform="rotate(-28 24 25)" fill="none" stroke="url(#bbd-g-bolt)" strokeWidth="2.2" strokeDasharray="95 30" strokeDashoffset="10" />
    </IconSvg>
  );
}

export function PaintArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <path d="M5 26c0-11 9-19 20-19 10 0 18 6 18 14 0 5-4 7-8 6-3-.5-5 1-4.5 4 .6 3.5-1.5 7-7.5 7C12.5 38 5 33 5 26Z" fill="url(#bbd-g-cream)" stroke={ICON.boltEdge} strokeLinejoin="round" />
      <circle cx="14" cy="23" r="3.2" fill={ICON.wmpBlue} />
      <circle cx="20" cy="15" r="3.2" fill={ICON.wmpGreen} />
      <circle cx="29" cy="13.5" r="3.2" fill={ICON.wmpYellow} />
      <circle cx="36" cy="18" r="2.8" fill={ICON.wmpOrange} />
      <circle cx="15" cy="31" r="2.8" fill={ICON.redBottom} />
      <circle cx="24" cy="31" r="2.6" fill="none" stroke={ICON.boltEdge} strokeWidth="0.8" />
      <path d="M27 42 43 20" stroke={ICON.pencilDark} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M27 42 43 20" stroke={ICON.pencil} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M23.5 46 27 41.5 29.5 43.5 26 47Z" fill={ICON.lead} />
    </IconSvg>
  );
}

export function DetailsArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <MiniWindow x={4} y={8} width={40} height={32} panel />
    </IconSvg>
  );
}

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
export const ChevronsRightGlyph = bbGlyph(ArrowRightDoubleIcon);
export const MicGlyph = bbGlyph(Mic01Icon);
export const NotePadGlyph = bbGlyph(Notebook01Icon);
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
  const Badge = kind === "project" ? ProjectGlyph : kind === "machine" ? MachineGlyph : kind === "folder" ? PinGlyph : null;
  const showBadge = Badge !== null && size >= 24;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <IconSvg size={size}>
        <FolderShape>
          {empty ? null : (
            <>
              <rect x="10" y="7" width="27" height="15" rx="1" fill={ICON.paper} stroke={ICON.paperEdge} strokeWidth="0.6" transform="rotate(5 23 14)" />
              <rect x="8" y="9" width="28" height="14" rx="1" fill={ICON.paper} stroke={ICON.paperEdge} strokeWidth="0.6" />
              <path d="M12 13h14M12 16.5h10" stroke={ICON.line} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
        </FolderShape>
      </IconSvg>
      {showBadge ? (
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
      ) : null}
    </span>
  );
}

function Buddy({ x, y, scale, fill, edge }: { x: number; y: number; scale: number; fill: string; edge: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-11 22c0-8 5-13 11-13s11 5 11 13a2 2 0 0 1-2 2h-18a2 2 0 0 1-2-2z" fill={fill} stroke={edge} strokeWidth="1.2" />
      <circle cx="0" cy="0" r="7" fill={fill} stroke={edge} strokeWidth="1.2" />
      <ellipse cx="-2.4" cy="-2.6" rx="3.2" ry="2.2" fill={ICON.paper} opacity="0.55" />
      <ellipse cx="-4" cy="13.5" rx="3.6" ry="2.2" fill={ICON.paper} opacity="0.35" />
    </g>
  );
}

export function BuddyListArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <Buddy x={30} y={11} scale={0.9} fill="url(#bbd-g-play)" edge={ICON.playBottom} />
      <Buddy x={18} y={19} scale={1} fill="url(#bbd-g-ok)" edge={ICON.okEdge} />
    </IconSvg>
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

export function NotePadArt({ size = 40 }: { size?: number }) {
  const coils = [11, 17, 23, 29, 35];
  return (
    <IconSvg size={size}>
      <g transform="rotate(-8 24 26)">
        <rect x="7" y="8" width="32" height="36" rx="2.5" fill={ICON.navyBottom} stroke={ICON.navyEdge} />
        <rect x="9" y="10" width="30" height="33" rx="1.5" fill="url(#bbd-g-notepad)" stroke={ICON.blueOutline} strokeWidth="0.7" />
        <path d="M12 19h24M12 24h24M12 29h24M12 34h24M12 39h18" stroke={ICON.notepadLine} strokeWidth="1.3" strokeLinecap="round" />
        {coils.map((x) => (
          <g key={x}>
            <path d={`M${x} 13.5v-6a2 2 0 0 1 4 0v4`} fill="none" stroke={ICON.metalEdge} strokeWidth="2.4" strokeLinecap="round" />
            <path d={`M${x} 13.5v-6a2 2 0 0 1 4 0v4`} fill="none" stroke={ICON.metal} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx={x + 2} cy="13" r="1.1" fill={ICON.navyEdge} />
          </g>
        ))}
      </g>
    </IconSvg>
  );
}

export function MediaPlayerArt({ size = 40 }: { size?: number }) {
  return (
    <IconSvg size={size}>
      <circle cx="24" cy="24" r="20.5" fill={ICON.wmpRim} />
      <path d="M4.50 24.00A19.5 19.5 0 0 1 24.00 4.50L24.00 10.50A13.5 13.5 0 0 0 10.50 24.00Z" fill={ICON.wmpOrange} />
      <path d="M24.00 4.50A19.5 19.5 0 0 1 43.50 24.00L37.50 24.00A13.5 13.5 0 0 0 24.00 10.50Z" fill={ICON.wmpGreen} />
      <path d="M43.50 24.00A19.5 19.5 0 0 1 24.00 43.50L24.00 37.50A13.5 13.5 0 0 0 37.50 24.00Z" fill={ICON.wmpYellow} />
      <path d="M24.00 43.50A19.5 19.5 0 0 1 4.50 24.00L10.50 24.00A13.5 13.5 0 0 0 24.00 37.50Z" fill={ICON.wmpBlue} />
      <path d="M4.5 24H43.5M24 4.5V43.5" stroke={ICON.paper} strokeWidth="1" />
      <circle cx="24" cy="24" r="13.5" fill="url(#bbd-g-disc)" stroke={ICON.discEdge} />
      <path d="M19.5 16.5 32.5 24 19.5 31.5Z" fill="url(#bbd-g-play)" stroke={ICON.playBottom} strokeLinejoin="round" />
      <path d="M8 16a18 18 0 0 1 16-11.5" stroke={ICON.paper} strokeOpacity="0.55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </IconSvg>
  );
}

function RecycleArrows() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.8 24.2A6.8 6.8 0 0 1 30.4 20.6" fill="none" stroke={ICON.recycleEdge} strokeWidth="4.4" />
      <path d="M30.6 30.2A6.8 6.8 0 0 1 19 33.8" fill="none" stroke={ICON.recycleEdge} strokeWidth="4.4" />
      <path d="M18.8 24.2A6.8 6.8 0 0 1 30.4 20.6" fill="none" stroke="url(#bbd-g-recycle)" strokeWidth="2.8" />
      <path d="M30.6 30.2A6.8 6.8 0 0 1 19 33.8" fill="none" stroke="url(#bbd-g-recycle)" strokeWidth="2.8" />
      <path d="M27.6 18.2 34 19.4 30.4 25Z" fill={ICON.recycleLight} stroke={ICON.recycleEdge} strokeWidth="0.9" />
      <path d="M21.8 36.2 15.4 35 19 29.4Z" fill={ICON.recycle} stroke={ICON.recycleEdge} strokeWidth="0.9" />
    </g>
  );
}

export function RecycleBinArt({ size = 40, full = false }: { size?: number; full?: boolean }) {
  return (
    <IconSvg size={size}>
      <path d="M7 10.5C15 5 33 4.5 41 8.5 33 12.5 15 13.5 7 10.5Z" fill={ICON.glassMid} stroke={ICON.glassEdge} strokeWidth="0.8" />
      {full ? (
        <g stroke={ICON.paperEdge} strokeWidth="0.7" strokeLinejoin="round">
          <path d="M14 13 13 3.5 22 1.5 24.5 11Z" fill={ICON.paper} />
          <path d="M15.5 6 21 4.8M16 8.5 22 7.4" stroke={ICON.paperShade} />
          <path d="M21 12 26.5 2.5 34.5 6.5 31 13.5Z" fill={ICON.cream} />
          <path d="M26 6.5 31.5 9" stroke={ICON.paperShade} />
          <path d="M11 14 13 20 20 22 17 15Z" fill={ICON.paper} />
        </g>
      ) : null}
      <path
        d="M7 10.5C15 13.5 33 12.5 41 8.5L36.5 39.5C35.8 42 13 42.5 12 39.8Z"
        fill="url(#bbd-g-glass)"
        fillOpacity={full ? 0.88 : 0.95}
        stroke={ICON.glassEdge}
        strokeLinejoin="round"
      />
      <path d="M13.5 37.5C18 36 30 35.5 35 37" stroke={ICON.paper} strokeOpacity="0.8" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M10.5 14.5 14 36" stroke={ICON.paper} strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10.8C16 13.4 32 12.6 40 9" stroke={ICON.paper} strokeOpacity="0.9" strokeWidth="1" fill="none" />
      <RecycleArrows />
    </IconSvg>
  );
}

export type StatusKind = "attention" | "working" | "error" | "archived" | "idle";

function SmallSvg({ size, children, className }: { size: number; children: ReactNode; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: "none" }} className={className} aria-hidden>
      <IconDefs />
      {children}
    </svg>
  );
}

export function WarningArt({ size = 16 }: { size?: number }) {
  return (
    <SmallSvg size={size}>
      <path d="M8 1.3a1 1 0 0 1 .87.5l6.4 11.5a1 1 0 0 1-.87 1.5H1.6a1 1 0 0 1-.87-1.5L7.13 1.8A1 1 0 0 1 8 1.3Z" fill="url(#bbd-g-warn)" stroke={ICON.warnEdge} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M8 5.3v4.2" stroke={ICON.lead} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="12" r="1" fill={ICON.lead} />
    </SmallSvg>
  );
}

export function StatusIcon({ kind, size = 14 }: { kind: StatusKind; size?: number }) {
  switch (kind) {
    case "attention":
      return <WarningArt size={size} />;
    case "working":
      return (
        <SmallSvg size={size} className="bbd-hourglass">
          <path d="M3.5 1.5h9M3.5 14.5h9" stroke={ICON.frame} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M4.5 1.5C4.5 5.5 7.3 6.6 7.3 8S4.5 10.5 4.5 14.5h7c0-4-2.8-5.1-2.8-6.5s2.8-2.5 2.8-6.5Z" fill={ICON.glassTop} stroke={ICON.frame} strokeLinejoin="round" />
          <path d="M5.6 13.6c.4-2 1.4-2.8 2.4-2.8s2 .8 2.4 2.8ZM6.2 4h3.6C9.4 5.5 8.6 6.2 8 6.6 7.4 6.2 6.6 5.5 6.2 4Z" fill={ICON.sand} />
        </SmallSvg>
      );
    case "error":
      return (
        <SmallSvg size={size}>
          <circle cx="8" cy="8" r="7" fill="url(#bbd-g-red)" stroke={ICON.redEdge} />
          <path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" stroke={ICON.paper} strokeWidth="2" strokeLinecap="round" />
          <path d="M3.6 6a4.8 4.8 0 0 1 4-3.6" stroke={ICON.paper} strokeOpacity="0.6" strokeWidth="1" fill="none" strokeLinecap="round" />
        </SmallSvg>
      );
    case "archived":
      return <RecycleBinArt size={size} />;
    case "idle":
      return (
        <SmallSvg size={size}>
          <circle cx="8" cy="8" r="7" fill="url(#bbd-g-ok)" stroke={ICON.okEdge} />
          <path d="M4.6 8.3 7 10.6l4.4-5" fill="none" stroke={ICON.paper} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.6 6a4.8 4.8 0 0 1 4-3.6" stroke={ICON.paper} strokeOpacity="0.6" strokeWidth="1" fill="none" strokeLinecap="round" />
        </SmallSvg>
      );
  }
}
