import { useRef, useState, useSyncExternalStore, type MouseEventHandler, type PointerEvent as ReactPointerEvent, type PointerEventHandler, type ReactNode } from "react";
import { CloseGlyph, MaximizeGlyph, MinusGlyph, RestoreGlyph } from "../art";
import type { ResizeEdge } from "../core";
import { fitDragRect, resizeInArea, workAreaRect } from "./geometry";
import { useWindowManager } from "./manager";
import { subscribeNudges, takeWindowNudge, windowNudge } from "./nudges";
import { previewRect, usePointerTracker } from "./pointer";
import type { DesktopWindow } from "./state";

const EDGES: readonly ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

/** Shared title chrome; note pads retain their own persisted placement and lifecycle. */
export function WindowTitleBar({ title, icon, titleActions, maximized, onPointerDown, onDoubleClick, onMinimize, onMaximize, onClose }: {
  title: string; icon: ReactNode; titleActions?: ReactNode; maximized?: boolean;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onDoubleClick?: MouseEventHandler<HTMLElement>;
  onMinimize?: () => void; onMaximize?: () => void; onClose: () => void;
}) {
  return <header className="bbd-titlebar" onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>
    <span className="flex size-4 flex-none items-center justify-center">{icon}</span>
    <span className="min-w-0 flex-1 truncate">{title}</span>
    {titleActions}
    {onMinimize && <button type="button" className="bbd-titlebar-button" aria-label="Minimize" title="Minimize to the dock" onClick={onMinimize}><MinusGlyph className="size-3.5" strokeWidth={2} /></button>}
    {onMaximize && <button type="button" className="bbd-titlebar-button" aria-label={maximized ? "Restore" : "Maximize"} title={maximized ? "Restore" : "Maximize"} onClick={onMaximize}>{maximized ? <RestoreGlyph className="size-3.5" strokeWidth={2} /> : <MaximizeGlyph className="size-3.5" strokeWidth={2} />}</button>}
    <button type="button" className="bbd-titlebar-button ml-0.5" data-variant="close" aria-label="Close" title="Close" onClick={onClose}><CloseGlyph className="size-3.5" strokeWidth={2} /></button>
  </header>;
}

export function WindowFrame({
  window: desktopWindow,
  title,
  icon,
  titleActions,
  statusBar,
  children,
  onClose,
  keepMounted = false,
}: {
  window: DesktopWindow;
  title: string;
  icon: ReactNode;
  titleActions?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  keepMounted?: boolean;
}) {
  const manager = useWindowManager();
  const track = usePointerTracker();
  const frameRef = useRef<HTMLElement>(null);
  const { id } = desktopWindow;
  const focused = manager.focusedId === id;
  const maximized = desktopWindow.restoreRect !== null;
  const nudge = useSyncExternalStore(subscribeNudges, () => windowNudge(id));
  const [settling, setSettling] = useState(false);
  const rect = nudge === undefined ? desktopWindow.rect : { ...desktopWindow.rect, x: desktopWindow.rect.x + nudge.x, y: desktopWindow.rect.y + nudge.y };

  const settle = () => {
    const taken = takeWindowNudge(id);
    if (taken === undefined) return;
    setSettling(true);
    manager.move(id, { ...desktopWindow.rect, x: desktopWindow.rect.x + taken.x, y: desktopWindow.rect.y + taken.y });
    requestAnimationFrame(() => setSettling(false));
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>, edge?: ResizeEdge) => {
    if (event.button !== 0 || event.isPrimary === false || (event.target as HTMLElement).closest("button") !== null) return;
    const element = frameRef.current;
    if (!element) return;
    manager.focus(id);
    const area = workAreaRect();
    const origin = maximized && !edge ? fitDragRect({
      ...desktopWindow.restoreRect!,
      x: event.clientX - (event.clientX - rect.x) / rect.width * desktopWindow.restoreRect!.width,
      y: event.clientY - Math.min(24, event.clientY - rect.y),
    }, area) : fitDragRect(rect, area);
    let latest = origin;
    track(event, (delta) => {
      latest = edge ? resizeInArea(origin, edge, delta, area)
        : fitDragRect({ ...origin, x: origin.x + delta.x, y: origin.y + delta.y }, area);
      element.dataset.dragging = "true";
      if (maximized) element.removeAttribute("data-maximized");
      if (edge || maximized) previewRect(element, latest);
      else element.style.transform = `translate(${latest.x - rect.x}px, ${latest.y - rect.y}px)`;
    }, (cancelled, moved) => {
      element.style.transform = "";
      previewRect(element, cancelled || !moved ? rect : latest);
      // Settle the transform with transitions disabled before restoring nudge animation.
      if (moved) element.getBoundingClientRect();
      delete element.dataset.dragging;
      if (maximized && (cancelled || !moved)) element.dataset.maximized = "true";
      if (!cancelled && moved) manager.move(id, latest);
    });
  };

  const startMove = (event: ReactPointerEvent<HTMLElement>) => startDrag(event);
  const startResize = (edge: ResizeEdge) => (event: ReactPointerEvent<HTMLElement>) => startDrag(event, edge);

  if (desktopWindow.minimized && !keepMounted) return null;

  return (
    <section
      ref={frameRef}
      role="dialog"
      aria-label={title}
      className="bbd-window"
      hidden={desktopWindow.minimized}
      data-focused={focused}
      data-maximized={maximized || undefined}
      data-settling={settling}
      style={{
        left: desktopWindow.rect.x,
        top: desktopWindow.rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: desktopWindow.z,
        transform: nudge === undefined ? undefined : `translate(${nudge.x}px, ${nudge.y}px)`,
      }}
      onPointerDownCapture={() => {
        settle();
        manager.focus(id);
      }}
    >
      <WindowTitleBar title={title} icon={icon} titleActions={titleActions} maximized={maximized}
        onPointerDown={startMove}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button") === null) manager.toggleMaximize(id);
        }}
        onMinimize={() => manager.minimize(id, true)}
        onMaximize={() => manager.toggleMaximize(id)}
        onClose={() => { onClose?.(); manager.close(id); }}
      />
      <div className="bbd-window-body">{children}</div>
      {statusBar !== undefined ? <footer className="bbd-statusbar">{statusBar}</footer> : null}
      {maximized
        ? null
        : EDGES.map((edge) => (
            <div
              key={edge}
              className="bbd-resize"
              data-edge={edge}
              aria-hidden
              onPointerDown={startResize(edge)}
            />
          ))}
      {maximized ? null : <div className="bbd-grip" aria-hidden />}
    </section>
  );
}
