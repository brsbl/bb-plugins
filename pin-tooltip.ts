import { isUrlPin, type Reference } from "./contract.js";
import { urlPinName } from "./url-pin.js";

/** Longest value a tooltip shows in full; longer ones keep both ends, where paths and URLs differ. */
export const TOOLTIP_MAX_CHARS = 240;

export function truncateMiddle(value: string, max = TOOLTIP_MAX_CHARS): string {
  if (value.length <= max) return value;
  const head = Math.ceil((max - 1) / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - (max - 1 - head))}`;
}

export type PinTooltip = { value: string; note?: string };

/** A pin's tooltip: a URL's title when one was set, else the URL, or a file's path with its machine when elsewhere. */
export function pinTooltip(pin: Reference, threadHostId: string | null): PinTooltip {
  if (isUrlPin(pin)) {
    const titled = pin.name !== urlPinName(pin.url);
    return { value: truncateMiddle(titled ? pin.name : pin.url) };
  }
  const machine = pin.hostId !== threadHostId ? pin.hostName : undefined;
  const status = pin.status === "missing" ? "(missing)" : pin.status === "unavailable" ? "(unavailable)" : undefined;
  const note = [machine, status].filter(Boolean).join(" ");
  return { value: truncateMiddle(pin.path), note: note || undefined };
}
