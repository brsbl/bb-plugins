/**
 * Quick Launch stores these ids in `preferences.quickLaunch` (see `DEFAULT_QUICK_LAUNCH` in `core.ts`; the server
 * accepts up to 24 ids of at most 64 characters). They are a stored contract: add ids, never rename or remove one.
 */
export const LAUNCHER_IDS = [
  "show-desktop",
  "new-thread",
  "new-folder",
  "threads",
  "recycle-bin",
  "media-player",
  "minesweeper",
  "solitaire",
  "pinball",
  "command-prompt",
  "paint",
  "sticky-note",
  "internet-explorer",
  "search",
  "run",
  "plugins",
  "skills",
] as const;

export type LauncherId = (typeof LAUNCHER_IDS)[number];

/** A program another plugin registered through `window.bbDesktopApps`. */
export function appLauncherId(key: string): string {
  return `app:${key}`;
}
