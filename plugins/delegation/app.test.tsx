// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { resolve, type SettingSource, type SettingsOverrides } from "./settings.js";

afterEach(cleanup);

function render(initial: SettingsOverrides = {}, sources: Record<string, SettingSource> = {}) {
  let overrides: Record<string, unknown> = { ...initial };
  const state = () => resolve(overrides, { values: sources, checkedAt: Object.keys(sources).length ? 1_791_600_000_000 : null });
  return loadPluginApp(() => import("./app.js")).then((app) => renderSlot(app.settingsSections[0]!, {}, {
    rpc: {
      getState: () => state(),
      saveSettings: (input: unknown) => {
        const { values, reset } = input as { values: SettingsOverrides; reset?: string[] };
        overrides = { ...overrides, ...values };
        for (const key of reset ?? []) delete overrides[key];
        return state();
      },
    },
    sdk: {
      providers: { list: async () => [{ id: "claude-code", displayName: "Claude Code", available: true }, { id: "codex", displayName: "Codex", available: true }] as never },
      hosts: { list: async () => [{ id: "host_mac", name: "MacBook", status: "connected", lifecycle: { phase: "active" } }, { id: "host_old", name: "Old Air", status: "disconnected", lifecycle: { phase: "active" } }] as never },
      threadSections: { list: async () => [{ id: "sec_content", name: "Content", createdAt: 1, updatedAt: 1 }] },
    },
  }));
}

const saves = (slot: Awaited<ReturnType<typeof render>>) =>
  slot.inspection.rpcCalls.filter((call) => call.method === "saveSettings").map((call) => call.input);

describe("Delegation settings form", () => {
  it("registers one settings section", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.settingsSections.map((section) => section.id)).toEqual(["delegation"]);
  });

  it("fills its dropdowns from bb and saves each change as an override", async () => {
    const slot = await render();
    const machine = await slot.findByRole("combobox", { name: "Machine" }) as HTMLSelectElement;
    await waitFor(() => expect([...machine.options].map((option) => option.textContent)).toEqual(["The lead's machine", "MacBook", "Old Air (offline)"]));
    const section = slot.getByRole("combobox", { name: "Section" }) as HTMLSelectElement;
    await waitFor(() => expect([...section.options].map((option) => option.textContent)).toEqual(["The lead's section", "Content"]));

    fireEvent.change(machine, { target: { value: "host_old" } });
    fireEvent.click(slot.getByRole("switch", { name: "Archive and stop finished workers" }));
    const retries = slot.getByRole("spinbutton", { name: "Automatic retries" });
    fireEvent.change(retries, { target: { value: "4" } });
    fireEvent.blur(retries);

    await waitFor(() => expect(saves(slot)).toEqual([
      { values: { machine: "host_old" } },
      { values: { mayArchiveOrStop: true } },
      { values: { retryLimit: 4 } },
    ]));
    expect(await slot.findAllByText("Your override.")).toHaveLength(3);
  });

  it("locks a setting your instructions set, quotes them, and flags an ignored override", async () => {
    const slot = await render({ mayArchiveOrStop: false }, {
      mayArchiveOrStop: { value: true, source: "~/.bb/AGENTS.md", quote: "stop its runtime and archive the worker" },
    });
    const toggle = await slot.findByRole("switch", { name: "Archive and stop finished workers" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect((toggle as HTMLButtonElement).disabled).toBe(true);
    expect(slot.getByText("From ~/.bb/AGENTS.md")).toBeDefined();
    expect(slot.getByText(/Your override \(off\) is ignored/)).toBeDefined();
    fireEvent.click(slot.getByRole("button", { name: "Remove override" }));
    await waitFor(() => expect(saves(slot)).toEqual([{ values: {}, reset: ["mayArchiveOrStop"] }]));
  });

  it("clears the chosen model when the provider changes", async () => {
    const slot = await render({ provider: "claude-code", model: "claude-opus-5-5" });
    const provider = await slot.findByRole("combobox", { name: "Provider" });
    await waitFor(() => expect((provider as HTMLSelectElement).options).toHaveLength(3));
    fireEvent.change(provider, { target: { value: "codex" } });
    await waitFor(() => expect(saves(slot).at(-1)).toEqual({ values: { provider: "codex" }, reset: ["model", "reasoningLevel"] }));
  });

  it("rejects an out-of-range number without saving", async () => {
    const slot = await render();
    const lines = await slot.findByRole("spinbutton", { name: "Worker report length" }) as HTMLInputElement;
    fireEvent.change(lines, { target: { value: "0" } });
    fireEvent.blur(lines);
    expect(lines.value).toBe("3");
    expect(saves(slot)).toEqual([]);
  });
});
