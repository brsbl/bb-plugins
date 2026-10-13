/**
 * Club identity as colour.
 *
 * A player card carries its club's colours because that is how football
 * identifies a team — you read Arsenal before you read "ARS". Values are the
 * clubs' own primaries, muted toward a warm neutral so twenty of them can sit
 * on one pitch without shouting, then nudged darker if they land in the band
 * where neither white nor ink is legible on top.
 */

const KIT: Record<string, [string, string]> = {
  ARS: ["#EF0107", "#FFFFFF"], AVL: ["#670E36", "#95BFE5"], BOU: ["#DA020E", "#000000"],
  BRE: ["#E30613", "#FFFFFF"], BHA: ["#0057B8", "#FFFFFF"], CHE: ["#034694", "#FFFFFF"],
  COV: ["#78D0F3", "#1D1D1B"], CRY: ["#1B458F", "#C4122E"], EVE: ["#003399", "#FFFFFF"],
  FUL: ["#1D1D1B", "#FFFFFF"], HUL: ["#F5A12D", "#1D1D1B"], IPS: ["#3A64A3", "#FFFFFF"],
  LEE: ["#1D428A", "#FFCE00"], LIV: ["#C8102E", "#FFFFFF"], MCI: ["#6CABDD", "#1C2C5B"],
  MUN: ["#DA291C", "#FBE122"], NEW: ["#241F20", "#FFFFFF"], NFO: ["#DD0000", "#FFFFFF"],
  TOT: ["#132257", "#FFFFFF"], SUN: ["#EB172B", "#FFFFFF"],
};

const FALLBACK: [string, string] = ["#8A8580", "#FFFFFF"];
const INK = "#2A2725";
const PAPER = "#FFFFFF";

function toRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(rgb: number[]): string {
  return `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const channels = toRgb(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pull a colour toward warm neutral; keeps the hue readable, drops the shout. */
export function mute(hex: string, amount = 0.42, toward: number[] = [150, 146, 138]): string {
  return toHex(toRgb(hex).map((v, i) => v + ((toward[i] ?? v) - v) * amount));
}

/** Darken until at least one of white or ink clears WCAG AA on this ground. */
function legible(hex: string): string {
  let value = hex;
  for (let i = 0; i < 40; i += 1) {
    if (contrast(PAPER, value) >= 4.5 || contrast(INK, value) >= 4.5) return value;
    value = toHex(toRgb(value).map((v) => v * 0.94));
  }
  return value;
}

/** The label colour that actually wins on contrast, not one guessed from luminance. */
export function onColor(background: string): string {
  return contrast(PAPER, background) >= contrast(INK, background) ? PAPER : INK;
}

export function kitFor(club: string): { ground: string; trim: string; label: string } {
  const [primary, secondary] = KIT[club] ?? FALLBACK;
  const ground = legible(mute(primary));
  return { ground, trim: mute(secondary, 0.55), label: onColor(ground) };
}

/** A player who cannot be relied on gets a greyer version of the same colour. */
export function fadedKit(club: string): { ground: string; trim: string; label: string } {
  const base = kitFor(club);
  const ground = mute(base.ground, 0.55, [214, 210, 204]);
  return { ground, trim: base.trim, label: onColor(ground) };
}

export const CLUBS = Object.keys(KIT);
