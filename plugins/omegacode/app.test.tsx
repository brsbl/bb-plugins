// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { PluginNavPanelProps } from "@bb/plugin-sdk";
import { loadPluginApp, renderSlot } from "@bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it } from "vitest";

import type { GlobalRun, rpcContract } from "./server";

const RUNS: GlobalRun[] = [
  {
    runId: "wf_active",
    workflow: "release.workflow.js",
    workflowName: "Release review",
    phases: ["Audit", "Verify"],
    createdAt: 100,
    updatedAt: 200,
    heartbeatAgeMs: 1_000,
    status: "running",
    counts: {
      total: 2,
      running: 1,
      queued: 1,
      completed: 0,
      failed: 0,
      cancelled: 0,
    },
    agents: [
      {
        index: 1,
        label: "Audit package",
        phase: "Audit",
        provider: "codex",
        model: "gpt-test",
        state: "running",
        startedAt: 100,
        bytes: 20,
        tokens: 10,
        durationMs: 100,
      },
      {
        index: 2,
        label: "Verify install",
        phase: "Verify",
        provider: null,
        model: null,
        state: "queued",
        startedAt: null,
        bytes: 0,
        tokens: 0,
        durationMs: 0,
      },
    ],
    owner: {
      threadId: "thr_owner",
      environmentId: "env_owner",
      projectId: "proj_owner",
      threadTitle: "Plugin consolidation",
      threadAvailable: true,
    },
  },
  {
    runId: "wf_complete",
    workflow: "inventory.workflow.js",
    workflowName: "Inventory",
    phases: [],
    createdAt: 50,
    updatedAt: 75,
    heartbeatAgeMs: 60_000,
    status: "completed",
    counts: {
      total: 1,
      running: 0,
      queued: 0,
      completed: 1,
      failed: 0,
      cancelled: 0,
    },
    agents: [],
    owner: null,
  },
];

afterEach(() => cleanup());

describe("Omegacode global workflow page", () => {
  it("shows all runs, filters by status, expands details, and opens the owning thread", async () => {
    const app = await loadPluginApp(() => import("./app"));
    expect(app.navPanels).toHaveLength(1);
    expect(app.navPanels[0]?.title).toBe("Omegacode");
    expect(app.composerAccessories).toHaveLength(1);

    const panel = app.navPanels[0]!;
    const rendered = renderSlot<PluginNavPanelProps, typeof rpcContract>(
      panel,
      { subPath: "" },
      {
        rpc: {
          allRuns: () => ({ runs: RUNS, scannedAt: 300 }),
          runs: () => ({ runs: [], scannedAt: 300 }),
        },
      },
    );

    expect(
      await screen.findByRole("heading", { name: "Across threads" }),
    ).not.toBeNull();
    expect(screen.getByText("Release review")).not.toBeNull();
    expect(screen.getByText("Inventory")).not.toBeNull();
    expect(screen.getByText("Plugin consolidation")).not.toBeNull();
    expect(screen.getAllByText("Outside bb")).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Open thread Plugin consolidation" }),
    );
    expect(rendered.inspection.navigateCalls).toContainEqual({
      method: "toThread",
      threadId: "thr_owner",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Show details for Release review" }),
    );
    expect(screen.getByText("Audit package")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    await waitFor(() => {
      expect(screen.queryByText("Inventory")).toBeNull();
    });

    rendered.lifecycle.unmount();
  }, 120_000);
});
