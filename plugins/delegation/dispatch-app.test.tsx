// @vitest-environment jsdom
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

afterEach(cleanup);

it.each([
  { name: "legacy complete", timelinePage: { hasOlderRows: false }, olderHistory: false },
  { name: "legacy incomplete", timelinePage: { hasOlderRows: true }, olderHistory: true },
  { name: "cursor complete", timelinePage: { olderCursor: null }, olderHistory: false },
  { name: "cursor incomplete", timelinePage: { olderCursor: { anchorId: "sample-anchor", anchorSeq: 1 } }, olderHistory: true },
  { name: "missing cursor", timelinePage: {}, olderHistory: false },
  { name: "cursor reaches oldest page", timelinePage: { olderCursor: { anchorId: "sample-anchor", anchorSeq: 1 } }, olderHistory: true, endsAt: 60 },
])("shows collapsed replies and loads bounded history: $name", async ({ timelinePage, olderHistory, endsAt }) => {
  const completion = {
    id: "completion", kind: "conversation", role: "user", createdAt: 2,
    initiator: "system", systemMessageKind: "child-completed",
    systemMessageSubject: { kind: "thread", threadId: "sample-worker" },
    text: "[bb system]\n\n@thread:sample-worker completed:\n\nSynthetic total: 42.",
  };
  const timeline = vi.fn(async ({ threadId, includeNestedRows, segmentLimit }: {
    threadId: string; includeNestedRows?: string; segmentLimit?: string;
  }) => ({
    rows: threadId === "sample-lead" ? [{
      id: "collapsed-turn", kind: "turn", createdAt: 1,
      children: includeNestedRows === "true" ? [
        completion,
        { id: "nested-turn", kind: "turn", children: [
          { ...completion },
          { ...completion, id: "follow-up", createdAt: 3, text: "Confirmed: 42." },
        ] },
      ] : null,
    }] : endsAt && Number(segmentLimit) < endsAt ? [] : [{
      id: "brief", kind: "conversation", role: "user", initiator: "user", createdAt: 1,
      text: "Calculate the synthetic total.",
    }],
    timelinePage: endsAt && Number(segmentLimit) >= endsAt ? { olderCursor: null } : timelinePage,
  }) as never);
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.threadPanelActions[0]!, { threadId: "sample-lead", params: null }, {
    sidebarThreads: { threads: [{
      id: "sample-worker", parentThreadId: "sample-lead", originKind: null,
      isArchived: false, displayTitle: "Sample worker", updatedAt: 1,
    }] as never },
    sdk: { threads: { timeline } },
  });

  await slot.findByText("Synthetic total: 42.");
  expect(slot.getAllByText("Synthetic total: 42.")).toHaveLength(1);
  await slot.findByText("Confirmed: 42.");
  expect(Array.from(slot.container.querySelectorAll(".dp-reply"), (row) => row.textContent)).toEqual([
    "Synthetic total: 42.", "Confirmed: 42.",
  ]);
  if (olderHistory) {
    // A short channel widens the latest window until history ends or it hits the cap.
    await waitFor(() => expect(slot.inspection.sdkCalls.some((call) =>
      call.method === "threads.timeline" && (call.args[0] as { segmentLimit?: string }).segmentLimit === String(endsAt ?? 100),
    )).toBe(true));
  }
  if (!olderHistory || endsAt) {
    await slot.findByText("Calculate the synthetic total.");
  }
  for (const call of slot.inspection.sdkCalls.filter((call) => call.method === "threads.timeline")) {
    expect(call.args[0]).toMatchObject({ includeNestedRows: "true" });
    expect(Number((call.args[0] as { segmentLimit: string }).segmentLimit)).toBeLessThanOrEqual(endsAt ?? (olderHistory ? 100 : 40));
  }
});
