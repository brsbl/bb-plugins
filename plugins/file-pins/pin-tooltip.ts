import { isUrlPin, type Reference } from "./contract.js";

/** Longest value a tooltip shows in full; longer ones keep both ends, where paths and URLs differ. */
export const TOOLTIP_MAX_CHARS = 240;

export function truncateMiddle(value: string, max = TOOLTIP_MAX_CHARS): string {
  if (value.length <= max) return value;
  const head = Math.ceil((max - 1) / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - (max - 1 - head))}`;
}

export type PinTooltip = { address: string; title: string; note?: string };

/** Keep the destination visible even when the pin has a custom title. */
export function pinTooltip(pin: Reference, threadHostId: string | null): PinTooltip {
  if (isUrlPin(pin)) {
    return { address: truncateMiddle(pin.url), title: truncateMiddle(pin.name) };
  }
  const machine = pin.hostId !== threadHostId ? pin.hostName : undefined;
  const status = pin.status === "missing" ? "(missing)" : pin.status === "unavailable" ? "(unavailable)" : undefined;
  const note = [machine, status].filter(Boolean).join(" ");
  return { address: truncateMiddle(pin.path), title: truncateMiddle(pin.name), note: note || undefined };
}
