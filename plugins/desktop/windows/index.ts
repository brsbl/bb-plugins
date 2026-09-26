export { TASKBAR_SELECTOR, chromeTop, defaultRect, fitDragRect, resizeInArea, viewportRect, workAreaRect, type Size } from "./geometry";
export { WindowManagerProvider, useWindowManager, type WindowManager } from "./manager";
export { setWindowNudges } from "./nudges";
export { DRAG_THRESHOLD, crossedDragThreshold, previewRect, trackPointer, usePointerTracker } from "./pointer";
export { WindowFrame, WindowTitleBar } from "./frame";
export { threadIdOf, windowId, type SpecOf, type ThreadTabKind, type WindowKind, type WindowSpec } from "./specs";
export type { DesktopWindow } from "./state";
