import { isUrlPin, type Reference } from "./contract.js";
import { urlLabel } from "./url-pin.js";

/**
 * How long a pin's label may be on the strip and in the overflow list, in characters, by kind of pin.
 * The full name stays in the pin's tooltip and accessible label. Change a limit here; the strip measures the result.
 *
 * - `file`: a file name. The middle of the name goes first; the extension always stays.
 * - `title`: a URL pin with its own title. The end goes first, at a word break when one is close.
 * - `url`: a URL pin labelled by its address (`host/first/…/last`). Path segments go first, then the
 *   last segment's end; the host goes last, keeping its end (`…example.com`).
 */
export const PIN_LABEL_LIMITS = { file: 28, title: 36, url: 32 } as const;
export const ELLIPSIS = "…";
// An extension longer than this is part of the name, not a type to keep.
const MAX_EXTENSION = 8;
// A title cut may back up this far to end on a whole word.
const WORD_SLACK = 8;

/** The label a pin shows on the strip: its name, shortened by the rule for its kind. */
export function pinLabel(pin: Reference): string {
  if (!isUrlPin(pin)) return fileLabel(pin.name);
  return pin.name === urlLabel(pin.url) ? addressLabel(pin.url) : titleLabel(pin.name);
}

/** Keeps both ends of `value`, the start a character longer when they can't be even. */
export function cutMiddle(value: string, max: number): string {
  const chars = [...value];
  if (chars.length <= max) return value;
  const keep = Math.max(0, max - 1);
  const head = Math.ceil(keep / 2);
  return `${chars.slice(0, head).join("")}${ELLIPSIS}${chars.slice(chars.length - (keep - head)).join("")}`;
}

/** A preview header keeps the beginning of an address and its final file or page name. */
export function previewAddressLabel(value: string, max = 44): string {
  let shown = value;
  let last: string | undefined;
  if (/^https?:\/\//iu.test(value)) {
    try {
      const url = new URL(value);
      // A query or fragment can contain slashes, but cannot name the destination page.
      shown = value.split(/[?#]/u, 1)[0]!;
      last = url.pathname.split("/").at(-1);
    } catch { /* Keep an unparseable address as written. */ }
  }
  if ([...shown].length <= max) return shown;
  const start = [...shown].slice(0, Math.min(12, max - 4)).join("");
  const lastSlash = shown.lastIndexOf("/");
  last ??= shown.slice(lastSlash + 1);
  const room = max - [...start].length - 2; // ellipsis and slash
  if (lastSlash > start.length && last && room >= 4) return `${start}${ELLIPSIS}/${fileLabel(last, room)}`;
  return cutMiddle(shown, max);
}

export function fileLabel(name: string, max: number = PIN_LABEL_LIMITS.file): string {
  const chars = [...name];
  if (chars.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot) : "";
  // The extension stays when the name keeps at least a few characters of its own.
  if (!extension || [...extension].length > MAX_EXTENSION || max - [...extension].length < 4) return cutMiddle(name, max);
  return cutMiddle(name.slice(0, dot), max - [...extension].length) + extension;
}

export function titleLabel(title: string, max: number = PIN_LABEL_LIMITS.title): string {
  const chars = [...title];
  if (chars.length <= max) return title;
  const kept = chars.slice(0, max - 1).join("");
  // Kept text that already ends at a word stays whole; otherwise back up to the last break when it is close.
  const space = kept.lastIndexOf(" ");
  const atBreak = /[\s,.:;!?|–—-]/u.test(chars[max - 1]!);
  const cut = !atBreak && space > 0 && space >= kept.length - WORD_SLACK ? kept.slice(0, space) : kept;
  return `${cut.replace(/[\s,.:;–—-]+$/u, "")}${ELLIPSIS}`;
}

export function addressLabel(href: string, max: number = PIN_LABEL_LIMITS.url): string {
  const full = urlLabel(href);
  if ([...full].length <= max) return full;
  const [host = "", ...path] = full.split("/");
  const last = path.at(-1);
  // 1. Drop the first segments, keeping the page's own name: host/…/last.
  if (last !== undefined && path.length > 1) {
    const short = `${host}/${ELLIPSIS}/${last}`;
    if ([...short].length <= max) return short;
  }
  // 2. Shorten the last segment from its end, keeping the start that names the page, while a few characters remain.
  if (last !== undefined) {
    const prefix = path.length > 1 ? `${host}/${ELLIPSIS}/` : `${host}/`;
    const room = max - [...prefix].length;
    if (room >= 6) return `${prefix}${[...last].slice(0, room - 1).join("")}${ELLIPSIS}`;
  }
  // 3. Only the host, keeping its end, where the registrable name is.
  const hostChars = [...host];
  return hostChars.length <= max ? host : ELLIPSIS + hostChars.slice(hostChars.length - (max - 1)).join("");
}
