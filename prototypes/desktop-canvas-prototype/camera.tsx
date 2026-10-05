import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { clampZoom, type Camera, type Point, type Rect } from "./core";

/** Room the floating dock keeps at the bottom of the screen; maximized windows and Fit all stop above it. */
export const DOCK_RESERVE = 76;
const CAMERA_KEY = "desktop-canvas-prototype:camera:v1";
const ANIMATION_MS = 220;

export interface CanvasControls {
  rootRef: RefObject<HTMLDivElement | null>;
  /** The latest camera, for event handlers that must not re-render on every pan frame. */
  getCamera(): Camera;
  /** The screen rect, relative to the canvas root, that windows maximize into and Fit all frames. */
  getWorkArea(): Rect;
  setCamera(next: Camera | ((current: Camera) => Camera), options?: { animate?: boolean }): void;
  /** A client point (from a pointer event) relative to the canvas root. */
  toLocal(clientX: number, clientY: number): Point;
}

const CameraContext = createContext<Camera | null>(null);
const WorkAreaContext = createContext<Rect | null>(null);
const ControlsContext = createContext<CanvasControls | null>(null);

export function useCamera(): Camera {
  const camera = useContext(CameraContext);
  if (camera === null) throw new Error("useCamera outside CanvasProvider");
  return camera;
}

export function useWorkArea(): Rect {
  const area = useContext(WorkAreaContext);
  if (area === null) throw new Error("useWorkArea outside CanvasProvider");
  return area;
}

export function useCanvasControls(): CanvasControls {
  const controls = useContext(ControlsContext);
  if (controls === null) throw new Error("useCanvasControls outside CanvasProvider");
  return controls;
}

function readCamera(): Camera {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CAMERA_KEY) ?? "null");
    if (typeof parsed === "object" && parsed !== null) {
      const { x, y, zoom } = parsed as Record<string, unknown>;
      if ([x, y, zoom].every((value) => typeof value === "number" && Number.isFinite(value))) {
        return { x: x as number, y: y as number, zoom: clampZoom(zoom as number) };
      }
    }
  } catch {
    // Fall through to the default view.
  }
  return { x: 0, y: 0, zoom: 1 };
}

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
const ease = (t: number) => 1 - (1 - t) ** 3;

/** Owns the camera and the canvas's screen geometry. Camera changes re-render only what reads `useCamera`. */
export function CanvasProvider({ rootRef, children }: { rootRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const [camera, setCameraState] = useState(readCamera);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [area, setArea] = useState<Rect>({ x: 0, y: 0, width: 1200, height: 800 - DOCK_RESERVE });
  const areaRef = useRef(area);
  areaRef.current = area;
  const frame = useRef<number | null>(null);

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (element === null) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setArea((current) => {
        const next = { x: 0, y: 0, width: Math.round(width), height: Math.max(0, Math.round(height) - DOCK_RESERVE) };
        return current.width === next.width && current.height === next.height ? current : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootRef]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(CAMERA_KEY, JSON.stringify(camera));
      } catch {
        // The view is a convenience; losing it on a full disk is fine.
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [camera]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const setCamera = useCallback<CanvasControls["setCamera"]>((next, options) => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const target = typeof next === "function" ? next(cameraRef.current) : next;
    if (!options?.animate || reducedMotion()) {
      cameraRef.current = target;
      setCameraState(target);
      return;
    }
    const from = cameraRef.current;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / ANIMATION_MS);
      const k = ease(t);
      const current = { x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k, zoom: from.zoom + (target.zoom - from.zoom) * k };
      cameraRef.current = current;
      setCameraState(current);
      frame.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
  }, []);

  const controls = useMemo<CanvasControls>(
    () => ({
      rootRef,
      getCamera: () => cameraRef.current,
      getWorkArea: () => areaRef.current,
      setCamera,
      toLocal(clientX, clientY) {
        const bounds = rootRef.current?.getBoundingClientRect();
        return { x: clientX - (bounds?.left ?? 0), y: clientY - (bounds?.top ?? 0) };
      },
    }),
    [rootRef, setCamera],
  );

  return (
    <ControlsContext.Provider value={controls}>
      <WorkAreaContext.Provider value={area}>
        <CameraContext.Provider value={camera}>{children}</CameraContext.Provider>
      </WorkAreaContext.Provider>
    </ControlsContext.Provider>
  );
}
