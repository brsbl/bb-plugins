// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as ReactPointerEvent } from "react";
import { crossedDragThreshold, fitDragRect, resizeInArea, trackPointer } from "./index";
import type { ResizeEdge } from "../core";

const area = { x: 0, y: 48, width: 1000, height: 772 };
const rect = { x: 200, y: 200, width: 400, height: 300 };

describe("desktop drag geometry", () => {
  it("keeps click jitter below the four-pixel threshold", () => {
    expect(crossedDragThreshold({ x: 2, y: 2 })).toBe(false);
    expect(crossedDragThreshold({ x: 0, y: 4 })).toBe(true);
  });
  it("keeps the entire frame below chrome and above the taskbar", () => {
    expect(fitDragRect({ ...rect, x: -500, y: -200 }, area)).toEqual({ ...rect, x: 0, y: 48 });
    expect(fitDragRect({ ...rect, x: 1500, y: 900 }, area)).toEqual({ ...rect, x: 600, y: 520 });
  });
  it("fits an oversized saved frame after a viewport shrink", () => {
    expect(fitDragRect(rect, { x: 0, y: 48, width: 200, height: 100 })).toEqual({ x: 0, y: 48, width: 200, height: 100 });
  });
  it.each<ResizeEdge>(["n", "s", "e", "w", "ne", "nw", "se", "sw"])("bounds the %s handle and preserves its opposite edge", (edge) => {
    const next = resizeInArea(rect, edge, { x: edge.includes("w") ? -2000 : 2000, y: edge.includes("n") ? -2000 : 2000 }, area);
    expect(next.x).toBeGreaterThanOrEqual(area.x);
    expect(next.y).toBeGreaterThanOrEqual(area.y);
    expect(next.x + next.width).toBeLessThanOrEqual(area.width);
    expect(next.y + next.height).toBeLessThanOrEqual(area.y + area.height);
    if (edge.includes("w")) expect(next.x + next.width).toBe(rect.x + rect.width);
    else expect(next.x).toBe(rect.x);
    if (edge.includes("n")) expect(next.y + next.height).toBe(rect.y + rect.height);
    else expect(next.y).toBe(rect.y);
  });
  it("stops a northwest resize at the minimum without drifting the opposite corner", () => {
    expect(resizeInArea(rect, "nw", { x: 1000, y: 1000 }, area)).toEqual({ x: 320, y: 320, width: 280, height: 180 });
  });
});

function pointer(type: string, x: number, pointerId = 1) {
  const event = new MouseEvent(type, { clientX: x, clientY: 0, bubbles: true });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  return event;
}
function gesture() {
  window.dispatchEvent(pointer("pointerdown", 0));
  const target = document.createElement("div");
  document.body.append(target);
  target.setPointerCapture = vi.fn();
  target.hasPointerCapture = vi.fn(() => true);
  target.releasePointerCapture = vi.fn();
  const move = vi.fn();
  const end = vi.fn();
  const cancel = trackPointer({ currentTarget: target, clientX: 0, clientY: 0, pointerId: 1, button: 0 } as unknown as ReactPointerEvent<HTMLElement>, move, end);
  return { target, move, end, cancel };
}

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ""; });

describe("pointer lifecycle", () => {
  it("coalesces movement and flushes the final position exactly once on drop", () => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const g = gesture();
    for (let x = 4; x < 64; x++) window.dispatchEvent(pointer("pointermove", x));
    expect(g.move).not.toHaveBeenCalled();
    window.dispatchEvent(pointer("pointerup", 64));
    expect(g.move).toHaveBeenCalledTimes(1);
    expect(g.move.mock.calls[0]![0]).toEqual({ x: 64, y: 0 });
    expect(g.end).toHaveBeenCalledExactlyOnceWith(false, true);
    expect(g.target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(document.querySelector(".bbd-drag-shield")).toBeNull();
  });
  it.each(["pointercancel", "lostpointercapture", "blur", "contextmenu", "Escape", "unmount"])("cleans up on %s without committing a pending move", (reason) => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    document.documentElement.style.userSelect = "text";
    const g = gesture();
    window.dispatchEvent(pointer("pointermove", 10));
    if (reason === "unmount") g.cancel();
    else if (reason === "Escape") window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    else if (reason === "lostpointercapture") g.target.dispatchEvent(pointer(reason, 10));
    else window.dispatchEvent(pointer(reason, 10));
    window.dispatchEvent(pointer("pointerup", 20));
    expect(g.end).toHaveBeenCalledExactlyOnceWith(true, true);
    expect(g.move).not.toHaveBeenCalled();
    expect(document.documentElement.style.userSelect).toBe("text");
    expect(document.querySelector(".bbd-drag-shield")).toBeNull();
    expect(g.target.releasePointerCapture).toHaveBeenCalledTimes(1);
  });
  it("suppresses a cancelled press's release click but permits the next gesture", () => {
    const g = gesture();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(pointer("pointerup", 0));
    const click = () => new MouseEvent("click", { detail: 1, bubbles: true, cancelable: true });
    expect(g.target.dispatchEvent(click())).toBe(false);
    window.dispatchEvent(pointer("pointerdown", 0));
    expect(g.target.dispatchEvent(click())).toBe(true);
  });
  it.each([1, 2])("does not capture button %s", (button) => {
    const target = document.createElement("div");
    target.setPointerCapture = vi.fn();
    trackPointer({ currentTarget: target, button } as unknown as ReactPointerEvent<HTMLElement>, vi.fn());
    expect(target.setPointerCapture).not.toHaveBeenCalled();
  });
  it("ignores other pointers and preserves a tiny drag as a click", () => {
    const g = gesture();
    window.dispatchEvent(pointer("pointermove", 20, 2));
    window.dispatchEvent(pointer("pointerup", 20, 2));
    expect(g.end).not.toHaveBeenCalled();
    window.dispatchEvent(pointer("pointermove", 2));
    window.dispatchEvent(pointer("pointerup", 2));
    expect(g.move).not.toHaveBeenCalled();
    expect(g.end).toHaveBeenCalledExactlyOnceWith(false, false);
  });
});
