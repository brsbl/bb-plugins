// @vitest-environment jsdom

import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  loadPluginApp,
  renderSlot,
  type PluginRpcTestHandlers,
} from "@get-bb/plugin-sdk/testing/app";

import type { rpcContract } from "./server";

type Catalog = Awaited<ReturnType<PluginRpcTestHandlers<typeof rpcContract>["themeCatalog"]>>;

const DEFAULT_CATALOG: Catalog = {
  activeThemeId: "default",
  revision: 0,
  themes: [
    {
      id: "default",
      name: "Default",
      light: null,
      dark: null,
    },
    {
      id: "plugin:endless:endless-color",
      name: "Endless Color",
      light: null,
      dark: null,
    },
  ],
};

const ENDLESS_CATALOG: Catalog = {
  ...DEFAULT_CATALOG,
  activeThemeId: "plugin:endless:endless-color",
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

let panel: Awaited<ReturnType<typeof loadPluginApp>>["navPanels"][number];

beforeAll(async () => {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  const app = await loadPluginApp(() => import("./app"));
  const registered = app.navPanels.find(({ id }) => id === "preview");
  if (!registered) throw new Error("Theme Preview panel was not registered");
  panel = registered;
});

afterEach(() => cleanup());

function renderPreview(rpc: PluginRpcTestHandlers<typeof rpcContract>) {
  return renderSlot(panel, { subPath: "thread" }, { rpc });
}

async function chooseEndlessDark(): Promise<void> {
  const control = document.querySelector<HTMLButtonElement>("[data-tp-theme-control]");
  if (!control) throw new Error("Theme picker control was not rendered");
  await waitFor(() => expect(control.textContent).toContain("Default"));
  fireEvent.click(control);
  const endlessLabels = screen.getAllByText("Endless Color");
  const darkOption = endlessLabels[1]?.closest("button");
  if (!darkOption) throw new Error("Endless Color dark option was not rendered");
  fireEvent.click(darkOption);
}

describe("Theme Preview picker", () => {
  it("owns a visible pending state and blocks duplicate selections", async () => {
    const pending = deferred<Catalog>();
    let selectionCalls = 0;
    renderPreview({
      themeCatalog: () => DEFAULT_CATALOG,
      setTheme: () => {
        selectionCalls += 1;
        return pending.promise;
      },
    });

    await chooseEndlessDark();

    const control = screen.getByRole("button", { name: /Applying Endless Color dark/i });
    expect((control as HTMLButtonElement).disabled).toBe(true);
    expect(control.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(control);
    expect(selectionCalls).toBe(1);

    await act(async () => pending.resolve(ENDLESS_CATALOG));
    await waitFor(() => expect((screen.getByRole("button", { name: /Endless Color dark/i }) as HTMLButtonElement).disabled).toBe(false));
  });

  it("keeps a failed selection recoverable beside the owning control", async () => {
    let selectionCalls = 0;
    renderPreview({
      themeCatalog: () => DEFAULT_CATALOG,
      setTheme: () => {
        selectionCalls += 1;
        if (selectionCalls === 1) throw new Error("rpc disconnected");
        return ENDLESS_CATALOG;
      },
    });

    await chooseEndlessDark();

    expect((await screen.findByRole("alert")).textContent).toContain("Theme didn’t apply");
    fireEvent.click(screen.getByRole("button", { name: "Retry theme" }));
    await waitFor(() => expect((screen.getByRole("button", { name: /Endless Color dark/i }) as HTMLButtonElement).disabled).toBe(false));
    expect(selectionCalls).toBe(2);
  });
});
