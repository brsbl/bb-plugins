// The parts of @moss-multi/viewer's API version 1 (packages/viewer/src/types.ts)
// this plugin uses. The viewer runs inside its own frame document; the panel
// mounts it there and supplies every service it may reach.

export type MossViewerTheme = "light" | "dark";

export interface MossViewerNote {
  id: string;
  title: string;
  folderPath?: string;
  updatedAt?: number;
}

export type MossViewerTarget =
  | { kind: "note"; noteId: string; heading: string | null }
  | { kind: "url"; url: string; title: string };

export interface MossViewerServices {
  assetUrl?(ref: string, kind: "image" | "video"): string | null;
  notes?(): readonly MossViewerNote[] | Promise<readonly MossViewerNote[]>;
  navigate?(target: MossViewerTarget): void;
  unfurl?(url: string): Promise<null>;
  /** Where HTML blocks run live; without it they show Moss's cached screenshot. */
  htmlFrameUrl?: string;
}

export interface MossViewerOptions {
  markdown: string;
  layout?: unknown;
  theme: MossViewerTheme;
  noteId?: string;
  services: MossViewerServices;
}

export interface MossViewerHandle {
  readonly ready: Promise<void>;
  setTheme(theme: MossViewerTheme): void;
  unmount(): void;
}

interface FrameGlobals {
  mossViewer?: {
    api: number;
    mountMossViewer(element: HTMLElement, options: MossViewerOptions): MossViewerHandle;
  };
}

export const SUPPORTED_VIEWER_API = 1;

/** The frame's document URL, carrying the theme its first paint should use. */
export function frameSource(frameUrl: string, theme: MossViewerTheme): string {
  return `${frameUrl}?theme=${theme}`;
}

/**
 * The URL a note's media reference loads from. Web media keeps its own URL;
 * note-local files stream from the note's host through the plugin.
 */
export function assetHref(
  assetRoute: string,
  hostId: string,
  notePath: string,
  ref: string,
): string | null {
  const trimmed = ref.trim();
  if (/^(?:https?:|data:image\/)/i.test(trimmed)) return trimmed;
  if (trimmed === "" || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const query = new URLSearchParams({ host: hostId, note: notePath, ref: trimmed });
  return `${assetRoute}?${query.toString()}`;
}

/**
 * A web or mail link a note may open, normalized; null for any other scheme,
 * so a `javascript:` or `data:` link in a note can never run in bb's origin.
 */
export function safeExternalUrl(url: string, base?: string): string | null {
  try {
    const parsed = new URL(url, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** The viewer entry the frame exposes once its module has run, or null when it failed to load. */
export function frameViewer(frame: HTMLIFrameElement): NonNullable<FrameGlobals["mossViewer"]> | null {
  const viewer = (frame.contentWindow as (Window & FrameGlobals) | null)?.mossViewer;
  return viewer && viewer.api === SUPPORTED_VIEWER_API && typeof viewer.mountMossViewer === "function"
    ? viewer
    : null;
}

export function setFrameTheme(frame: HTMLIFrameElement, theme: MossViewerTheme): void {
  const root = frame.contentDocument?.documentElement;
  if (root) root.dataset.theme = theme;
}

/**
 * Keeps an unhandled link click from navigating the frame away from the viewer;
 * the link opens through bb instead. Moss's own link handling runs first and
 * marks the clicks it takes.
 */
export function routeFrameLinks(frame: HTMLIFrameElement, openUrl: (url: string) => void): () => void {
  const document = frame.contentDocument;
  if (!document) return () => undefined;
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    // The event comes from the frame's realm, so test shape rather than instanceof.
    const target = event.target as { closest?: (selector: string) => Element | null } | null;
    const anchor = target?.closest?.("a[href]");
    const href = anchor?.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    // Any other link does nothing rather than replacing the viewer.
    event.preventDefault();
    const url = safeExternalUrl(href, document.baseURI);
    if (url !== null) openUrl(url);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
