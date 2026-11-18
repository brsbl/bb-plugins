import { useEffect, useRef, useSyncExternalStore } from "react";
import { DetailsArt } from "../art";
import { attachAppWindow, registeredApps, subscribeApps, type DesktopApp } from "../bridge";
import { WindowFrame, type DesktopWindow } from "../windows";

/** Windows that other plugins open through `window.bbDesktopApps`; the plugin renders into the window body. */

export function useDesktopApps(): readonly DesktopApp[] {
  return useSyncExternalStore(subscribeApps, registeredApps);
}

export function AppIcon({ app, size }: { app: DesktopApp | undefined; size: number }) {
  return app?.icon === undefined ? (
    <DetailsArt size={size} />
  ) : (
    <img src={app.icon} width={size} height={size} alt="" style={{ flex: "none", objectFit: "contain" }} />
  );
}

export function AppWindow({ window: desktopWindow, appKey }: { window: DesktopWindow; appKey: string }) {
  const apps = useDesktopApps();
  const app = apps.find((candidate) => candidate.key === appKey);
  const bodyRef = useRef<HTMLDivElement>(null);
  const available = app !== undefined;
  useEffect(() => {
    const body = bodyRef.current;
    if (body === null || !available) return;
    return attachAppWindow(desktopWindow.id, appKey, body);
  }, [available, appKey, desktopWindow.id]);
  return (
    <WindowFrame window={desktopWindow} title={app?.title ?? "Program"} icon={<AppIcon app={app} size={16} />} keepMounted>
      {available ? (
        <div ref={bodyRef} className="bbd-app-body h-full overflow-auto" />
      ) : (
        <p className="p-6 text-center text-xs text-muted-foreground">
          This program isn't available right now. Its plugin may be turned off or still loading.
        </p>
      )}
    </WindowFrame>
  );
}
