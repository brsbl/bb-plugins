import { useEffect, useRef, useState, type RefObject } from "react";
import { setAppOpener } from "../bridge";
import { useDesktopEnabled } from "../enabled";
import { disposeWindow, windowSize } from "../programs/registry";
import type { DockFrame } from "../taskbar/taskbar";
import { WindowManagerProvider, useWindowManager } from "../windows";
import { DesktopCanvas } from "./canvas";
import { DesktopDataProvider } from "./data";
import { MenuProvider } from "./menu";
import { ComposerClearance, WindowLayer } from "./window-layer";

/** Centers the floating taskbar on the homepage column, which moves as bb's sidebar opens and closes. */
function useDockFrame(rootRef: RefObject<HTMLDivElement | null>): DockFrame | null {
  const [dockFrame, setDockFrame] = useState<DockFrame | null>(null);
  useEffect(() => {
    const element = rootRef.current;
    if (element === null) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setDockFrame({ left: rect.left + rect.width / 2, maxWidth: rect.width });
    };
    const observer = new ResizeObserver(measure);
    for (let node: Element | null = element; node !== null; node = node.parentElement) observer.observe(node);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [rootRef]);
  return dockFrame;
}

/** Lets other plugins open their registered programs, including while the desktop's data is still loading. */
function AppOpener() {
  const manager = useWindowManager();
  useEffect(() => {
    setAppOpener((key) => manager.open({ kind: "app", key }));
    return () => setAppOpener(null);
  }, [manager]);
  return null;
}

function DesktopShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dockFrame = useDockFrame(rootRef);
  return (
    <div ref={rootRef} className="bbd-root">
      <DesktopCanvas />
      <WindowLayer dockFrame={dockFrame} />
    </div>
  );
}

/** The Desktop homepage section: the icon canvas, and the windows and taskbar floating over bb. */
export function Desktop() {
  if (!useDesktopEnabled()) return null;
  return (
    <WindowManagerProvider sizeOf={windowSize} onDispose={disposeWindow}>
      <AppOpener />
      <ComposerClearance />
      <DesktopDataProvider>
        <MenuProvider>
          <DesktopShell />
        </MenuProvider>
      </DesktopDataProvider>
    </WindowManagerProvider>
  );
}
