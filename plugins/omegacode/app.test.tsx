// @vitest-environment jsdom

import { cleanup, fireEvent, screen } from "@testing-library/react";
import type { PluginNavPanelProps } from "@bb/plugin-sdk";
import { loadPluginApp, renderSlot } from "@bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it } from "vitest";

import { workerActivitySummary } from "./presentation";
import type { GlobalRun, rpcContract } from "./server";

function run(overrides: Partial<GlobalRun>): GlobalRun {
  return {
    runId: "wf_default",
    workflow: "default.workflow.js",
    workflowName: "Default workflow",
    description: null,
    phases: [],
    createdAt: 100,
    updatedAt: 200,
    heartbeatAgeMs: 1_000,
    status: "running",
    counts: {
      total: 1,
      running: 1,
      queued: 0,
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
    ],
    owner: {
      threadId: "thr_owner",
      environmentId: "env_owner",
      projectId: "proj_owner",
      threadTitle: "Plugin consolidation",
      threadAvailable: true,
    },
    ...overrides,
  };
}

const RUNS: GlobalRun[] = [
  run({
    runId: "wf_active",
    workflow: "release.workflow.js",
    workflowName: "Release review",
    description: "Review the release before it ships.",
    phases: ["Audit", "Verify"],
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
  }),
  run({
    runId: "wf_attention",
    workflow: "migration.workflow.js",
    workflowName: "Migration check",
    description: null,
    status: "stalled",
    counts: {
      total: 1,
      running: 1,
      queued: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    },
  }),
  run({
    runId: "wf_complete",
    workflow: "inventory.workflow.js",
    workflowName: "Inventory",
    description: "Record the current plugin inventory.",
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
  }),
  run({
    runId: "wf_cancelled",
    workflow: "cleanup.workflow.js",
    workflowName: "Cleanup",
    description: null,
    status: "cancelled",
    counts: {
      total: 1,
      running: 0,
      queued: 0,
      completed: 0,
      failed: 0,
      cancelled: 1,
    },
    agents: [],
  }),
];

afterEach(() => cleanup());

describe("Omegacode global workflow page", () => {
  it("prioritizes current and failed work before completed worker history", () => {
    const summary = workerActivitySummary(
      run({
        agents: [
          {
            index: 1,
            label: "Finished inventory",
            phase: "Inventory",
            provider: "codex",
            model: "gpt-test",
            state: "completed",
            startedAt: 10,
            bytes: 10,
            tokens: 5,
            durationMs: 20,
          },
          {
            index: 2,
            label: "Finished docs",
            phase: "Document",
            provider: "codex",
            model: "gpt-test",
            state: "completed",
            startedAt: 20,
            bytes: 10,
            tokens: 5,
            durationMs: 20,
          },
          {
            index: 3,
            label: "Finished build",
            phase: "Build",
            provider: "codex",
            model: "gpt-test",
            state: "completed",
            startedAt: 30,
            bytes: 10,
            tokens: 5,
            durationMs: 20,
          },
          {
            index: 4,
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
          {
            index: 5,
            label: "Implement migration",
            phase: "Build",
            provider: "codex",
            model: "gpt-test",
            state: "running",
            startedAt: 40,
            bytes: 10,
            tokens: 5,
            durationMs: 20,
          },
          {
            index: 6,
            label: "Audit package",
            phase: "Audit",
            provider: "codex",
            model: "gpt-test",
            state: "failed",
            startedAt: 50,
            bytes: 10,
            tokens: 5,
            durationMs: 20,
          },
        ],
      }).agents,
    );

    expect(summary).toBe(
      "Implement migration is working in Build; Audit package failed in Audit; Verify install is queued in Verify; plus 3 more.",
    );
  });

  it("separates live, attention, completed, and canceled workflows", async () => {
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

    expect(await screen.findByRole("heading", { name: "Across threads" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Active" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Needs attention" })).not.toBeNull();
    expect(screen.getByText("Review the release before it ships.")).not.toBeNull();
    expect(screen.getByText("Omegacode is coordinating 1 worker across Audit.")).not.toBeNull();
    expect(screen.getAllByText(/Audit package is working in Audit/)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Completed workflows" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: "Canceled workflows" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Inventory")).toBeNull();
    expect(screen.queryByText("Cleanup")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Completed workflows" }));
    expect(screen.getByText("Inventory")).not.toBeNull();
    expect(screen.getByText(/Outside bb · launched from local Omegacode · Source: inventory.workflow.js/)).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Show details for Inventory" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Canceled workflows" }));
    expect(screen.getByText("Cleanup")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open Release review's thread Plugin consolidation" }));
    expect(rendered.inspection.navigateCalls).toContainEqual({
      method: "toThread",
      threadId: "thr_owner",
    });

    fireEvent.click(screen.getByRole("button", { name: "Show details for Release review" }));
    expect(screen.getByText("Verify install")).not.toBeNull();

    rendered.lifecycle.unmount();
  }, 120_000);
});
