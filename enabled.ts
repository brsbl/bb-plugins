import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { stopMic } from "./services/mic";

const ENABLED_KEY = "bb-desktop:enabled";
const enabledListeners = new Set<() => void>();

function readEnabled(): boolean {
  return typeof localStorage === "undefined" || localStorage.getItem(ENABLED_KEY) !== "false";
}

function subscribeEnabled(listener: () => void) {
  enabledListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ENABLED_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    enabledListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Turns the desktop on or off in this browser. The switch lives in localStorage, so each device keeps its own. */
export function setDesktopEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, String(enabled));
  for (const listener of enabledListeners) listener();
}

export function toggleDesktop() {
  const enabled = !readEnabled();
  setDesktopEnabled(enabled);
  toast.success(enabled ? "Desktop turned on" : "Desktop turned off");
  if (enabled && window.location.pathname !== "/") {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

const COMPACT_QUERY = "(max-width: 767px)";

function subscribeCompact(listener: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function readCompact(): boolean {
  return window.matchMedia(COMPACT_QUERY).matches;
}

/** Whether the desktop is switched on in this browser, whatever the window width. */
export function useDesktopSwitch(): boolean {
  return useSyncExternalStore(subscribeEnabled, readEnabled);
}

/** Whether bb is in its compact (phone) layout, where the desktop never renders. */
export function useCompact(): boolean {
  return useSyncExternalStore(subscribeCompact, readCompact);
}

export function useDesktopEnabled(): boolean {
  const enabled = useDesktopSwitch();
  const compact = useCompact();
  return enabled && !compact;
}

/**
 * Releases the microphone once the desktop goes away: turned off in this tab or another, or bb narrowed to its
 * compact layout. It listens for the whole page because Media Player keeps playing while the desktop is unmounted.
 */
export function installMicRelease(): () => void {
  const release = () => {
    if (!readEnabled() || readCompact()) stopMic();
  };
  const unsubscribeEnabled = subscribeEnabled(release);
  const unsubscribeCompact = subscribeCompact(release);
  return () => {
    unsubscribeEnabled();
    unsubscribeCompact();
  };
}
