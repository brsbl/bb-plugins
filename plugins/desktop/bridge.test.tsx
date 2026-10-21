// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Bridge = typeof import("./bridge");
type Helper = typeof import("./skills/desktop-apps/desktop-app");

let bridge: Bridge;
let uninstall: () => void;

const app = { pluginId: "loop-machine", id: "main", title: "LM-919" };

beforeEach(async () => {
  vi.resetModules();
  bridge = await import("./bridge");
  uninstall = bridge.installDesktopBridge();
});

afterEach(() => {
  cleanup();
  uninstall();
  vi.restoreAllMocks();
});

describe("window.bbDesktopApps version 1", () => {
  it("publishes the registry and announces it", async () => {
    vi.resetModules();
    const fresh = await import("./bridge");
    const ready = vi.fn();
    window.addEventListener("bb-desktop-apps:ready", ready);
    const remove = fresh.installDesktopBridge();
    expect(window.bbDesktopApps?.version).toBe(1);
    expect(ready).toHaveBeenCalledTimes(1);
    remove();
    window.removeEventListener("bb-desktop-apps:ready", ready);
  });

  it("removes the registry and announces it when Desktop turns off", () => {
    const ready = vi.fn();
    window.addEventListener("bb-desktop-apps:ready", ready);
    uninstall();
    expect(window.bbDesktopApps).toBeUndefined();
    expect(ready).toHaveBeenCalledTimes(1);
    window.removeEventListener("bb-desktop-apps:ready", ready);
  });

  it("registers a valid app, trimming text and clamping its size", () => {
    window.bbDesktopApps?.registerApp({ ...app, title: "  LM-919  ", width: 99, height: 9000, icon: "/api/v1/plugins/loop-machine/assets/icon.svg" });
    expect(bridge.registeredApps()).toEqual([
      { key: "loop-machine/main", pluginId: "loop-machine", id: "main", title: "LM-919", description: undefined, icon: "/api/v1/plugins/loop-machine/assets/icon.svg", width: 240, height: 2000 },
    ]);
  });

  it("ignores invalid registrations with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    for (const input of [null, { ...app, pluginId: "bad id" }, { ...app, title: "" }, { ...app, id: "x".repeat(65) }]) {
      expect(window.bbDesktopApps?.registerApp(input as never)()).toBeUndefined();
    }
    expect(bridge.registeredApps()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(4);
  });

  it("drops icons that are not same-origin, https or image data", () => {
    window.bbDesktopApps?.registerApp({ ...app, icon: "javascript:alert(1)" });
    expect(bridge.registeredApps()[0]?.icon).toBeUndefined();
  });

  it("replaces an earlier registration of the same app, and only the current one unregisters it", () => {
    const first = window.bbDesktopApps!.registerApp(app);
    const second = window.bbDesktopApps!.registerApp({ ...app, title: "LM-919 v2" });
    first();
    expect(bridge.registeredApps().map((entry) => entry.title)).toEqual(["LM-919 v2"]);
    second();
    expect(bridge.registeredApps()).toEqual([]);
  });

  it("opens only registered apps, and only while Desktop can open windows", () => {
    expect(window.bbDesktopApps?.openApp("loop-machine", "main")).toBe(false);
    window.bbDesktopApps?.registerApp(app);
    expect(window.bbDesktopApps?.openApp("loop-machine", "main")).toBe(false);
    const open = vi.fn();
    bridge.setAppOpener(open);
    expect(window.bbDesktopApps?.openApp("loop-machine", "missing")).toBe(false);
    expect(window.bbDesktopApps?.openApp("loop-machine", "main")).toBe(true);
    expect(open).toHaveBeenCalledWith("loop-machine/main");
    bridge.setAppOpener(null);
  });

  it("keeps the same window snapshot until a window attaches or detaches", () => {
    const listener = vi.fn();
    window.bbDesktopApps?.subscribe(listener);
    const empty = window.bbDesktopApps?.windows("loop-machine", "main");
    expect(window.bbDesktopApps?.windows("loop-machine", "main")).toBe(empty);
    const element = document.createElement("div");
    const detach = bridge.attachAppWindow("window-1", "loop-machine/main", element);
    const open = window.bbDesktopApps?.windows("loop-machine", "main");
    expect(open).toEqual([{ windowId: "window-1", element }]);
    expect(window.bbDesktopApps?.windows("loop-machine", "main")).toBe(open);
    detach();
    expect(window.bbDesktopApps?.windows("loop-machine", "main")).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("the copied DesktopApp helper", () => {
  let helper: Helper;

  beforeEach(async () => {
    helper = await import("./skills/desktop-apps/desktop-app");
  });

  it("registers while mounted and renders into each open window", () => {
    const view = render(<helper.DesktopApp app={app}>{(windowId) => <p>playing in {windowId}</p>}</helper.DesktopApp>);
    expect(bridge.registeredApps().map((entry) => entry.key)).toEqual(["loop-machine/main"]);
    const element = document.createElement("div");
    document.body.append(element);
    act(() => {
      bridge.attachAppWindow("window-1", "loop-machine/main", element);
    });
    expect(element.textContent).toBe("playing in window-1");
    view.unmount();
    expect(bridge.registeredApps()).toEqual([]);
    element.remove();
  });

  it("registers when Desktop loads after the plugin, and lets go when Desktop turns off", () => {
    uninstall();
    render(<helper.DesktopApp app={app}>{() => null}</helper.DesktopApp>);
    expect(bridge.registeredApps()).toEqual([]);
    act(() => {
      uninstall = bridge.installDesktopBridge();
    });
    expect(bridge.registeredApps().map((entry) => entry.key)).toEqual(["loop-machine/main"]);
    act(() => uninstall());
    expect(helper.openInDesktop("loop-machine", "main")).toBe(false);
    act(() => {
      uninstall = bridge.installDesktopBridge();
    });
  });

  it("opens an app in Desktop, or reports false so the plugin can fall back", () => {
    expect(helper.openInDesktop("loop-machine", "main")).toBe(false);
    window.bbDesktopApps?.registerApp(app);
    const open = vi.fn();
    bridge.setAppOpener(open);
    expect(helper.openInDesktop("loop-machine", "main")).toBe(true);
    bridge.setAppOpener(null);
  });
});
