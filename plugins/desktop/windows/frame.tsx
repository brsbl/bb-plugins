import { useRef, type MouseEventHandler, type PointerEvent as ReactPointerEvent, type PointerEventHandler, type ReactNode } from "react";
import { CloseGlyph, MaximizeGlyph, MinusGlyph, RestoreGlyph } from "../art";
import type { Rect, ResizeEdge } from "../core";
import { fitDragRect, resizeInArea, workAreaRect } from "./geometry";
import { useWindowManager } from "./manager";
import { previewRect, usePointerTracker } from "./pointer";
import { dockedRect, isAttached, type DesktopWindow } from "./state";

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
  const { rect } = desktopWindow;

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
    const attached = maximized ? [] : manager.windows.flatMap((other) => {
      const node = isAttached(other, desktopWindow) ? document.querySelector<HTMLElement>(`[data-bbd-window-id="${CSS.escape(other.id)}"]`) : null;
      return node === null ? [] : [{ id: other.id, node, rect: other.rect }];
    });
    const dockedTo = (target: Rect) => attached.map((other) => dockedRect(other.rect, rect, target));
    track(event, (delta) => {
      latest = edge ? resizeInArea(origin, edge, delta, area)
        : fitDragRect({ ...origin, x: origin.x + delta.x, y: origin.y + delta.y }, area);
      element.dataset.dragging = "true";
      if (maximized) element.removeAttribute("data-maximized");
      if (edge || maximized) previewRect(element, latest);
      else element.style.transform = `translate(${latest.x - rect.x}px, ${latest.y - rect.y}px)`;
      dockedTo(latest).forEach((docked, index) => {
        const other = attached[index]!;
        other.node.dataset.dragging = "true";
        previewRect(other.node, fitDragRect(docked, area));
      });
    }, (_cancelled, moved, escaped) => {
      // Only Escape undoes a move or resize. Anything else that ends it early, such as the browser window losing focus,
      // a viewport resize or lost pointer capture, keeps where the window got to, so it never springs back on release.
      const commit = moved && !escaped;
      element.style.transform = "";
      previewRect(element, commit ? latest : rect);
      for (const other of attached) {
        if (!commit) previewRect(other.node, other.rect);
        other.node.getBoundingClientRect();
        delete other.node.dataset.dragging;
      }
      // Flush the cleared transform before the drag styles come off.
      if (moved) element.getBoundingClientRect();
      delete element.dataset.dragging;
      if (maximized && !commit) element.dataset.maximized = "true";
      if (commit) {
        const docked = dockedTo(latest);
        manager.move(id, latest, Object.fromEntries(attached.map((other, index) => [other.id, docked[index]!])));
      }
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
      data-bbd-window-id={id}
      hidden={desktopWindow.minimized}
      data-focused={focused}
      data-maximized={maximized || undefined}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: desktopWindow.z,
      }}
      onPointerDownCapture={() => manager.focus(id)}
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
