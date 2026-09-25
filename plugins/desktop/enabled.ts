import { useSyncExternalStore } from "react";
import { toast } from "sonner";

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

export function toggleDesktop() {
  const enabled = !readEnabled();
  localStorage.setItem(ENABLED_KEY, String(enabled));
  for (const listener of enabledListeners) listener();
  toast.success(enabled ? "Desktop turned on" : "Desktop turned off");
  if (enabled && window.location.pathname !== "/") {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function useDesktopEnabled(): boolean {
  return useSyncExternalStore(subscribeEnabled, readEnabled);
}
