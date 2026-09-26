import { type PointerEvent, useEffect, useRef, useState } from "react";

import { clampLayout, defaultLayout, type PaneBounds, parseLayout, type WindowLayout } from "./window-layout";

// Older versions saved only the position here; a saved size now rides along.
const LAYOUT_KEY = "context-katamari:position";

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * bb has no stable hook for the thread pane, so find it from the composer.
 * The conversation column is the widest ancestor of the prompt box before the
 * width jumps out to the whole main area around it.
 */
function findThreadPane(): PaneBounds | null {
  let element = document.querySelector("[data-promptbox-editor-content]")?.parentElement ?? null;
  if (!element) return null;
  const composerWidth = element.getBoundingClientRect().width;
  let pane: PaneBounds | null = null;
  while (element && element !== document.body) {
    const bounds = element.getBoundingClientRect();
    if (bounds.width > composerWidth + 64) break;
    pane = { left: bounds.left, right: bounds.right };
    element = element.parentElement;
  }
  return pane;
}

function readSavedLayout(): WindowLayout | null {
  try {
    const saved = parseLayout(JSON.parse(window.localStorage.getItem(LAYOUT_KEY) ?? "null"));
    return saved ? clampLayout(saved, viewport()) : null;
  } catch {
    return null;
  }
}

function saveLayout(layout: WindowLayout) {
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // The layout simply resets next time.
  }
}

/**
 * Where the window sits and how big it is, with pointer handlers for its move
 * grip and resize corner. A layout the person chose is saved and restored.
 */
export function useWindowLayout() {
  // Until the person moves or resizes the window, it keeps fitting beside the thread pane.
  const customizedRef = useRef(false);
  const [layout, setLayout] = useState<WindowLayout>(() => {
    const saved = readSavedLayout();
    customizedRef.current = saved !== null;
    return saved ?? defaultLayout(viewport(), findThreadPane());
  });
  const dragRef = useRef<{
    kind: "move" | "resize";
    pointerId: number;
    startX: number;
    startY: number;
    origin: WindowLayout;
  } | null>(null);

  useEffect(() => {
    const fit = () =>
      setLayout((current) =>
        // Refit from the saved layout so a window squeezed by a small viewport grows back.
        customizedRef.current
          ? (readSavedLayout() ?? clampLayout(current, viewport()))
          : defaultLayout(viewport(), findThreadPane()),
      );
    // The thread pane may render after the window does.
    const frame = window.requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, []);

  const beginDrag = (kind: "move" | "resize") => (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: layout,
    };
  };

  const continueDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    // The window is anchored bottom-right, so the top-left handle grows it up and left.
    setLayout(
      clampLayout(
        drag.kind === "move"
          ? { ...drag.origin, right: drag.origin.right - dx, bottom: drag.origin.bottom - dy }
          : { ...drag.origin, width: drag.origin.width - dx, height: drag.origin.height - dy },
        viewport(),
      ),
    );
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    customizedRef.current = true;
    setLayout((current) => {
      saveLayout(current);
      return current;
    });
  };

  return { layout, beginDrag, continueDrag, endDrag };
}
