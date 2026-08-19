// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

import { generateMeshGradient } from "./gradient.js";

const savedSpec = generateMeshGradient({ seed: 42, style: "ocean" });
const savedGradient = {
  id: "grad_1",
  name: "quiet lagoon",
  seed: 42,
  style: "ocean",
  edited: false,
  points: savedSpec.points,
  createdAt: 1,
};
const savedCustomSpec = generateMeshGradient({
  seed: 91,
  style: "custom",
  customColor: "#c2410c",
});
const savedCustomGradient = {
  id: "grad_custom",
  name: "ember field",
  seed: 91,
  style: "custom" as const,
  customColor: "#c2410c",
  edited: true,
  points: savedCustomSpec.points,
  createdAt: 2,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("mesh gradient app", () => {
  it("registers one studio thread panel action", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.navPanels).toHaveLength(0);
    expect(app.threadPanelActions).toMatchObject([
      { id: "studio", title: "Mesh Gradient", layout: "flush" },
    ]);
  });

  it("sends to the agent by auto-saving and seeding the thread composer", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      {
        rpc: {
          listSaved: () => ({ gradients: [] }),
          saveGradient: () => ({ gradient: savedGradient, alreadySaved: false }),
        },
      },
    );
    await slot.behavior.setComposerScope({ kind: "thread", threadId: "thr_1" });
    fireEvent.click(slot.getByRole("button", { name: "Send to agent" }));
    await waitFor(() => {
      expect(
        slot.inspection.rpcCalls.filter((call) => call.method === "saveGradient"),
      ).toHaveLength(1);
    });
    await waitFor(() => {
      expect(slot.inspection.composer.text).toMatch(
        /^Apply the .*mesh gradient to $/s,
      );
    });
    expect(slot.inspection.composer.mentions).toMatchObject([
      { provider: "gradient", id: "grad_1", label: "quiet lagoon" },
    ]);
    expect(slot.inspection.composer.focusCount).toBeGreaterThan(0);
    slot.lifecycle.unmount();
  });

  it("recolors a selected point through the inspector", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [] }) } },
    );
    fireEvent.pointerDown(slot.getByRole("button", { name: "Gradient point 1" }));
    const colorInput = (await slot.findByLabelText(
      "Point color",
    )) as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: "#ff0000" } });
    await waitFor(() => {
      const preview = slot.getByTestId("gradient-preview");
      expect(preview.style.backgroundImage).toContain("rgb(255, 0, 0)");
    });
    expect(slot.getByText(/edited · from seed/)).toBeTruthy();

    fireEvent.click(slot.getByRole("button", { name: "Undo" }));
    await waitFor(() => {
      const preview = slot.getByTestId("gradient-preview");
      expect(preview.style.backgroundImage).not.toContain("rgb(255, 0, 0)");
    });
    slot.lifecycle.unmount();
  });

  it("adds points from the overflow menu and removes via the inspector", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [] }) } },
    );
    const handles = () => slot.getAllByRole("button", { name: /^Gradient point/ });
    expect(handles()).toHaveLength(5);
    fireEvent.click(slot.getByRole("button", { name: "More actions" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Add point" }));
    await waitFor(() => expect(handles()).toHaveLength(6));
    fireEvent.pointerDown(slot.getByRole("button", { name: "Gradient point 6" }));
    fireEvent.click(await slot.findByRole("button", { name: "Delete point" }));
    await waitFor(() => expect(handles()).toHaveLength(5));
    slot.lifecycle.unmount();
  });

  it("sends a library gradient to the composer without re-saving", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [savedGradient] }) } },
    );
    await slot.behavior.setComposerScope({ kind: "thread", threadId: "thr_1" });
    fireEvent.click(
      await slot.findByRole("button", { name: "Send quiet lagoon to agent" }),
    );
    await waitFor(() => {
      expect(slot.inspection.composer.text).toMatch(
        /^Apply the .*mesh gradient to $/s,
      );
    });
    expect(slot.inspection.composer.mentions).toMatchObject([
      { provider: "gradient", id: "grad_1", label: "quiet lagoon" },
    ]);
    expect(
      slot.inspection.rpcCalls.filter((call) => call.method === "saveGradient"),
    ).toHaveLength(0);
    slot.lifecycle.unmount();
  });

  it("loads a saved gradient from the library", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [savedGradient] }) } },
    );
    fireEvent.click(await slot.findByText("quiet lagoon"));
    await waitFor(() => {
      expect(slot.getByText("seed 42")).toBeTruthy();
    });
    slot.lifecycle.unmount();
  });

  it("keeps a loaded custom color authoritative through reset and shuffle", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [savedCustomGradient] }) } },
    );

    fireEvent.click(await slot.findByText("ember field"));
    fireEvent.click(slot.getByRole("button", { name: "Gradient style" }));
    expect((slot.getByLabelText("Custom color") as HTMLInputElement).value).toBe(
      "#c2410c",
    );

    fireEvent.click(slot.getByRole("button", { name: "More actions" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Reset to seed" }));
    expect(slot.getByText("seed 91")).toBeTruthy();

    fireEvent.click(slot.getByRole("button", { name: "Shuffle" }));
    expect((slot.getByLabelText("Custom color") as HTMLInputElement).value).toBe(
      "#c2410c",
    );
    slot.lifecycle.unmount();
  });

  it("keeps library actions keyboard-focusable and visible for touch input", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [savedGradient] }) } },
    );
    const send = await slot.findByRole("button", {
      name: "Send quiet lagoon to agent",
    });
    const actions = send.parentElement!;

    expect(send.tabIndex).toBe(0);
    expect(actions.className).not.toContain("hidden");
    expect(actions.className).toContain("group-focus-within:opacity-100");
    expect(actions.className).toContain("[@media(hover:none)]:opacity-100");
    slot.lifecycle.unmount();
  });

  it("copies CSS for the current gradient", async () => {
    const writeText = vi.fn((_text: string) => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
      { rpc: { listSaved: () => ({ gradients: [] }) } },
    );
    fireEvent.click(slot.getByRole("button", { name: "More actions" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Copy CSS" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("background-image: radial-gradient(");
    slot.lifecycle.unmount();
  });
});
