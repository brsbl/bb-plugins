import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface DesktopAppRegistration {
  pluginId: string;
  id: string;
  title: string;
  description?: string;
  icon?: string;
  width?: number;
  height?: number;
}

interface DesktopAppWindow {
  windowId: string;
  element: HTMLElement;
}

interface DesktopBridge {
  version: 1;
  registerApp(app: DesktopAppRegistration): () => void;
  openApp(pluginId: string, id: string): boolean;
  windows(pluginId: string, id: string): readonly DesktopAppWindow[];
  subscribe(listener: () => void): () => void;
}

const NO_WINDOWS: readonly DesktopAppWindow[] = [];

function desktopBridge(): DesktopBridge | undefined {
  const bridge = (window as { bbDesktop?: DesktopBridge }).bbDesktop;
  return bridge?.version === 1 ? bridge : undefined;
}

function subscribeReady(listener: () => void) {
  window.addEventListener("bb-desktop:ready", listener);
  return () => window.removeEventListener("bb-desktop:ready", listener);
}

export function useDesktop(): DesktopBridge | undefined {
  return useSyncExternalStore(subscribeReady, desktopBridge);
}

export function openInDesktop(pluginId: string, id: string): boolean {
  return desktopBridge()?.openApp(pluginId, id) ?? false;
}

export function DesktopApp({
  app,
  children,
}: {
  app: DesktopAppRegistration;
  children: (windowId: string) => ReactNode;
}) {
  const desktop = useDesktop();
  const { pluginId, id, title, description, icon, width, height } = app;
  useEffect(
    () => desktop?.registerApp({ pluginId, id, title, description, icon, width, height }),
    [desktop, pluginId, id, title, description, icon, width, height],
  );
  const windows = useSyncExternalStore(
    (listener) => desktop?.subscribe(listener) ?? (() => undefined),
    () => desktop?.windows(pluginId, id) ?? NO_WINDOWS,
  );
  return (
    <span data-bbd-bridge-host hidden>
      {windows.map((window) => createPortal(children(window.windowId), window.element, window.windowId))}
    </span>
  );
}
