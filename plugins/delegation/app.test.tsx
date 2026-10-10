// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { DEFAULTS, type DelegationSettings } from "./settings.js";

afterEach(cleanup);

function render(initial: DelegationSettings = DEFAULTS) {
  let current = { ...initial };
  return loadPluginApp(() => import("./app.js")).then((app) => renderSlot(app.settingsSections[0]!, {}, {
    rpc: {
      getSettings: () => current,
      saveSettings: ({ values, reset }) => {
        current = { ...current, ...values };
        for (const key of reset ?? []) (current as Record<string, unknown>)[key] = DEFAULTS[key as keyof DelegationSettings];
        return current;
      },
    },
    sdk: {
      providers: { list: async () => [{ id: "claude-code", displayName: "Claude Code", available: true }, { id: "codex", displayName: "Codex", available: true }] as never },
      hosts: { list: async () => [{ id: "host_mac", name: "MacBook", status: "connected", lifecycle: { phase: "active" } }, { id: "host_old", name: "Old Air", status: "disconnected", lifecycle: { phase: "active" } }] as never },
      threadSections: { list: async () => [{ id: "sec_content", name: "Content", createdAt: 1, updatedAt: 1 }] },
    },
  }));
}

describe("Delegation settings form", () => {
  it("registers one settings section", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.settingsSections.map((section) => section.id)).toEqual(["delegation"]);
  });

  it("fills its dropdowns from bb and saves each change", async () => {
    const slot = await render();
    const machine = await slot.findByRole("combobox", { name: "Machine" }) as HTMLSelectElement;
    await waitFor(() => expect([...machine.options].map((option) => option.textContent)).toEqual(["The lead's machine", "MacBook", "Old Air (offline)"]));
    const section = slot.getByRole("combobox", { name: "Section" }) as HTMLSelectElement;
    await waitFor(() => expect([...section.options].map((option) => option.textContent)).toEqual(["The lead's section", "Content"]));
    expect((slot.getByRole("combobox", { name: "Provider" }) as HTMLSelectElement).value).toBe("claude-code");

    fireEvent.change(machine, { target: { value: "host_old" } });
    fireEvent.click(slot.getByRole("switch", { name: "Agents may archive or stop threads" }));
    const retries = slot.getByRole("spinbutton", { name: "Automatic retries" });
    fireEvent.change(retries, { target: { value: "4" } });
    fireEvent.blur(retries);

    await waitFor(() => expect(slot.inspection.rpcCalls.filter((call) => call.method === "saveSettings").map((call) => call.input)).toEqual([
      { values: { machine: "host_old" } },
      { values: { mayArchiveOrStop: true } },
      { values: { retryLimit: 4 } },
    ]));
  });

  it("clears chosen models when the provider changes", async () => {
    const slot = await render({ ...DEFAULTS, model: "claude-opus-5-5", qaModel: "claude-haiku-5-5" });
    const provider = await slot.findByRole("combobox", { name: "Provider" });
    await waitFor(() => expect((provider as HTMLSelectElement).options).toHaveLength(2));
    fireEvent.change(provider, { target: { value: "codex" } });
    await waitFor(() => expect(slot.inspection.rpcCalls.at(-1)).toEqual({
      method: "saveSettings", input: { values: { provider: "codex" }, reset: ["model", "reasoningLevel", "qaModel"] },
    }));
  });

  it("rejects an out-of-range number without saving", async () => {
    const slot = await render();
    const lines = await slot.findByRole("spinbutton", { name: "Worker report length" }) as HTMLInputElement;
    fireEvent.change(lines, { target: { value: "0" } });
    fireEvent.blur(lines);
    expect(lines.value).toBe("3");
    expect(slot.inspection.rpcCalls.some((call) => call.method === "saveSettings")).toBe(false);
  });
});
