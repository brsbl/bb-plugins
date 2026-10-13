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
    },
  }));
}

const saves = (slot: Awaited<ReturnType<typeof render>>) =>
  slot.inspection.rpcCalls.filter((call) => call.method === "saveSettings").map((call) => call.input);

const MODEL_TIERS = { source: "~/.claude/projects/x/memory/model-tiers.md", quote: "Leaf workers run on Codex GPT-6-Astra, extra-high reasoning." };

describe("Delegation settings form", () => {
  it("registers one settings section", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.settingsSections.map((section) => section.id)).toEqual(["delegation"]);
  });

  it("is one table: a row per role with when to create it, provider, model, and reasoning", async () => {
    const slot = await render();
    await slot.findByRole("table");
    expect(slot.getAllByRole("rowheader").map((cell) => cell.textContent?.trim())).toEqual(["Lead", "Parent", "Worker", "QA"]);
    expect(slot.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Role", "When to create", "Provider", "Model", "Reasoning"]);
    const when = Object.fromEntries(slot.getAllByRole("rowheader").map((cell) => [cell.querySelector(".dl-role")!.textContent, cell.closest("tr")!.querySelector(".dl-when")!.textContent]));
    expect(when).toMatchObject({ Lead: "Only when you ask", Parent: "When a worker will have its own reports", QA: "QA and smoke checks on approved work" });
    expect(slot.queryByRole("combobox", { name: "Machine" })).toBeNull();
    expect(slot.queryByRole("switch")).toBeNull();
  });

  it("shows the model your instructions set, locked, with the source on hover", async () => {
    const slot = await render({}, {
      provider: { value: "codex", ...MODEL_TIERS },
      model: { value: "gpt-6-astra", ...MODEL_TIERS },
      reasoningLevel: { value: "xhigh", ...MODEL_TIERS },
    });
    const model = await slot.findByRole("textbox", { name: "Worker model" }) as HTMLInputElement;
    expect(model.value).toBe("gpt-6-astra");
    expect(model.disabled).toBe(true);
    expect((slot.getByRole("combobox", { name: "Worker reasoning" }) as HTMLSelectElement).value).toBe("xhigh");
    expect(slot.getByRole("img", { name: "Set by your instructions" }).getAttribute("title")).toContain("Leaf workers run on Codex GPT-6-Astra");
  });

  it("saves a change as an override and resets it from the row", async () => {
    const slot = await render();
    const lead = await slot.findByRole("textbox", { name: "Lead model" });
    fireEvent.change(lead, { target: { value: "claude-opus-5-5" } });
    fireEvent.blur(lead);
    fireEvent.change(slot.getByRole("combobox", { name: "When to create workers" }), { target: { value: "ask" } });
    await waitFor(() => expect(saves(slot)).toEqual([{ values: { leadModel: "claude-opus-5-5" } }, { values: { spawnPolicy: "ask" } }]));
    fireEvent.click((await slot.findAllByRole("button", { name: "Reset your override" }))[0]!);
    await waitFor(() => expect(saves(slot).at(-1)).toEqual({ values: {}, reset: ["leadModel"] }));
  });

  it("flags an override your instructions ignore, and removes it", async () => {
    const slot = await render({ spawnPolicy: "free" }, { spawnPolicy: { value: "followthrough", source: "~/.bb/AGENTS.md", quote: "Spawn unasked only for follow-through." } });
    const policy = await slot.findByRole("combobox", { name: "When to create workers" }) as HTMLSelectElement;
    expect(policy.value).toBe("followthrough");
    expect(policy.disabled).toBe(true);
    fireEvent.click(slot.getByRole("button", { name: "Remove ignored override" }));
    await waitFor(() => expect(saves(slot)).toEqual([{ values: {}, reset: ["spawnPolicy"] }]));
  });

  it("clears a role's model when its provider changes", async () => {
    const slot = await render({ parentProvider: "claude-code", parentModel: "claude-opus-5-5" });
    const provider = await slot.findByRole("combobox", { name: "Parent provider" });
    await waitFor(() => expect((provider as HTMLSelectElement).options).toHaveLength(3));
    fireEvent.change(provider, { target: { value: "codex" } });
    await waitFor(() => expect(saves(slot).at(-1)).toEqual({ values: { parentProvider: "codex" }, reset: ["parentModel"] }));
  });
});
