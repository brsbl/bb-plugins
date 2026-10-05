// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPluginApp,
  mountPluginContentScripts,
  renderSlot,
  type MountedPluginContentScripts,
  type RenderedSlot,
} from "@get-bb/plugin-sdk/testing/app";
import { act } from "@testing-library/react";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const app = await loadPluginApp(() => import("./app"));
let mounted: MountedPluginContentScripts;

function link(href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = href;
  const child = document.createElement("span");
  child.textContent = "Open file";
  anchor.append(child);
  document.body.append(anchor);
  return anchor;
}

function click(
  target: Element,
  init: MouseEventInit = {},
): MouseEvent {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

beforeEach(async () => {
  mounted = await mountPluginContentScripts(app, {
    pluginId: "open-in-moss",
  });
});

afterEach(async () => {
  await mounted.lifecycle.dispose();
  document.body.replaceChildren();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Markdown link interception", () => {
  it("opens encoded Markdown file links through the plugin route", async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const anchor = link("file:///Users/brsbl/My%20Notes/spec.md#L12");
    const reachedAnchor = vi.fn();
    anchor.addEventListener("click", reachedAnchor);

    const event = click(anchor.firstElementChild!);

    expect(event.defaultPrevented).toBe(true);
    expect(reachedAnchor).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/plugins/open-in-moss/http/open",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: "/Users/brsbl/My Notes/spec.md" }),
      },
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("opens bb FileLink Markdown anchors through the plugin route", async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const anchor = link(`./${encodeURIComponent("/root/Moss/Notes/My Tweets.md")}`);
    const bbPreview = vi.fn();
    anchor.addEventListener("click", bbPreview);

    const event = click(anchor.firstElementChild!);

    expect(event.defaultPrevented).toBe(true);
    expect(bbPreview).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/plugins/open-in-moss/http/open",
      expect.objectContaining({
        body: JSON.stringify({ path: "/root/Moss/Notes/My Tweets.md" }),
      }),
    );
  });

  it("falls back to bb's FileLink preview when Moss cannot open the file", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    const anchor = link(`./${encodeURIComponent("/workspace/spec.md")}`);
    const bbPreview = vi.fn((event: Event) => event.preventDefault());
    anchor.addEventListener("click", bbPreview);

    click(anchor);

    await vi.waitFor(() => expect(bbPreview).toHaveBeenCalledOnce());
    expect(toast.error).toHaveBeenCalledWith("Moss couldn’t open this file", {
      description: "It was opened in bb instead.",
    });
  });

  it("falls back to the original bb click when Moss cannot open the file", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    const anchor = link("file:///workspace/spec.markdown");
    const bbPreview = vi.fn((event: Event) => event.preventDefault());
    anchor.addEventListener("click", bbPreview);

    click(anchor);

    await vi.waitFor(() => expect(bbPreview).toHaveBeenCalledOnce());
    expect(toast.error).toHaveBeenCalledWith("Moss couldn’t open this file", {
      description: "It was opened in bb instead.",
    });
  });

  it.each([
    ["unsupported_platform", 409],
    ["not_found", 404],
  ])("falls back to bb without a toast when no Mac has the file (%s)", async (code, status) => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status,
      json: async () => ({ ok: false, error: { code, message: "" } }),
    })));
    const anchor = link(`./${encodeURIComponent("/srv/notes/spec.md")}`);
    const bbPreview = vi.fn((event: Event) => event.preventDefault());
    anchor.addEventListener("click", bbPreview);

    click(anchor);

    await vi.waitFor(() => expect(bbPreview).toHaveBeenCalledOnce());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("still warns when Moss fails to open a file it has", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 502,
      json: async () => ({ ok: false, error: { code: "open_failed", message: "" } }),
    })));
    const anchor = link("file:///Users/brsbl/notes/spec.md");
    const bbPreview = vi.fn((event: Event) => event.preventDefault());
    anchor.addEventListener("click", bbPreview);

    click(anchor);

    await vi.waitFor(() => expect(bbPreview).toHaveBeenCalledOnce());
    expect(toast.error).toHaveBeenCalledWith("Moss couldn’t open this file", {
      description: "It was opened in bb instead.",
    });
  });

  it("intercepts modified primary clicks so they cannot open bb's viewer", async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const anchor = link("file:///workspace/spec.md");
    const event = click(anchor, { metaKey: true, shiftKey: true });

    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  });

  it("leaves non-Markdown, web, and right clicks alone", async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const cases: Array<[HTMLAnchorElement, MouseEventInit]> = [
      [link("file:///workspace/code.ts"), {}],
      [link("https://example.com/readme.md"), {}],
      [link("file:///workspace/spec.md"), { button: 2 }],
      [link(`./${encodeURIComponent("/workspace/code.ts")}`), {}],
      [link(`./${encodeURIComponent("notes/spec.md")}`), {}],
      [link("./notes/spec.md"), {}],
      [link(`./${encodeURIComponent("/workspace/spec.md")}`), { button: 2 }],
    ];

    for (const [anchor, init] of cases) {
      const reachedAnchor = vi.fn();
      anchor.addEventListener("click", (event) => {
        reachedAnchor();
        event.preventDefault();
      });
      click(anchor, init);
      expect(reachedAnchor).toHaveBeenCalledOnce();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("removes the interceptor when the plugin is disposed", async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    await mounted.lifecycle.dispose();
    const anchor = link("file:///workspace/spec.md");
    anchor.addEventListener("click", (event) => event.preventDefault());

    click(anchor);

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Moss Viewer", () => {
  type Plugin = { id: string; enabled: boolean };
  type Listener = (event: never) => void;
  let installed: Plugin[];
  let listeners: Map<string, Listener>;
  let overlay: RenderedSlot | undefined;

  function renderWatcher(plugins: Plugin[]) {
    installed = plugins;
    listeners = new Map();
    const list = vi.fn(async () => ({ plugins: installed }));
    overlay = renderSlot(app.appOverlays[0]!, {}, {
      sdk: {
        plugins: { list } as never,
        subscribe: ((args: { event: string; callback: Listener }) => {
          listeners.set(args.event, args.callback);
          return () => listeners.delete(args.event);
        }) as never,
      },
    });
    return list;
  }

  function emit(event: string, payload: unknown) {
    act(() => listeners.get(event)?.(payload as never));
  }

  function pluginsChanged(plugins: Plugin[]) {
    installed = plugins;
    emit("system:changed", { type: "changed", entity: "system", changes: ["plugins-changed"] });
  }

  // Clicks a fresh Markdown link and reports whether Open in Moss took it.
  function opensInMoss(): boolean {
    const anchor = link("file:///Users/brsbl/Moss/Notes/spec.md");
    let reachedBb = false;
    anchor.addEventListener("click", (event) => {
      reachedBb = true;
      event.preventDefault();
    });
    click(anchor);
    return !reachedBb;
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
  });

  afterEach(async () => {
    if (!overlay) return;
    pluginsChanged([]);
    await vi.waitFor(() => expect(opensInMoss()).toBe(true));
    overlay.lifecycle.unmount();
    overlay = undefined;
  });

  it("leaves Markdown links to bb's preview while Moss Viewer is enabled", async () => {
    renderWatcher([{ id: "moss-viewer", enabled: true }]);
    await vi.waitFor(() => expect(opensInMoss()).toBe(false));
    vi.mocked(fetch).mockClear();

    const anchor = link(`./${encodeURIComponent("/root/Moss/Notes/My Tweets.md")}`);
    const bbPreview = vi.fn();
    anchor.addEventListener("click", bbPreview);
    const event = click(anchor.firstElementChild!);

    expect(event.defaultPrevented).toBe(false);
    expect(bbPreview).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps opening links in Moss when Moss Viewer is installed but disabled", async () => {
    const list = renderWatcher([{ id: "moss-viewer", enabled: false }]);
    await vi.waitFor(() => expect(list).toHaveBeenCalledOnce());
    await Promise.resolve();

    expect(opensInMoss()).toBe(true);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  });

  it("follows Moss Viewer being installed, disabled, enabled, and removed", async () => {
    const list = renderWatcher([]);
    await vi.waitFor(() => expect(list).toHaveBeenCalledOnce());
    expect(opensInMoss()).toBe(true);

    pluginsChanged([{ id: "moss-viewer", enabled: true }]);
    await vi.waitFor(() => expect(opensInMoss()).toBe(false));

    pluginsChanged([{ id: "moss-viewer", enabled: false }]);
    await vi.waitFor(() => expect(opensInMoss()).toBe(true));

    pluginsChanged([{ id: "moss-viewer", enabled: true }]);
    await vi.waitFor(() => expect(opensInMoss()).toBe(false));

    pluginsChanged([]);
    await vi.waitFor(() => expect(opensInMoss()).toBe(true));
  });

  it("refreshes only for plugin changes or a reconnect", async () => {
    const list = renderWatcher([]);
    await vi.waitFor(() => expect(list).toHaveBeenCalledOnce());

    installed = [{ id: "moss-viewer", enabled: true }];
    emit("system:changed", { type: "changed", entity: "system", changes: ["config-changed"] });
    emit("realtime:connection", { state: "connected", reconnected: false, reconnectDelayMs: null });
    expect(list).toHaveBeenCalledOnce();

    emit("realtime:connection", { state: "connected", reconnected: true, reconnectDelayMs: null });
    await vi.waitFor(() => expect(opensInMoss()).toBe(false));
    expect(list).toHaveBeenCalledTimes(2);
  });
});
