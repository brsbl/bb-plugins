// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPluginApp,
  mountPluginContentScripts,
  type MountedPluginContentScripts,
} from "@get-bb/plugin-sdk/testing/app";
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
