// @vitest-environment jsdom
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

afterEach(cleanup);

it.each([false, true])("shows completed replies inside collapsed turns once, with older history=%s", async (hasOlderRows) => {
  const completion = {
    id: "completion", kind: "conversation", role: "user", createdAt: 2,
    initiator: "system", systemMessageKind: "child-completed",
    systemMessageSubject: { kind: "thread", threadId: "sample-worker" },
    text: "[bb system]\n\n@thread:sample-worker completed:\n\nSynthetic total: 42.",
  };
  const timeline = vi.fn(async ({ threadId, includeNestedRows }: { threadId: string; includeNestedRows?: string }) => ({
    rows: threadId === "sample-lead" ? [{
      id: "collapsed-turn", kind: "turn", createdAt: 1,
      children: includeNestedRows === "true" ? [
        completion,
        { id: "nested-turn", kind: "turn", children: [
          { ...completion },
          { ...completion, id: "follow-up", createdAt: 3, text: "Confirmed: 42." },
        ] },
      ] : null,
    }] : [{
      id: "brief", kind: "conversation", role: "user", initiator: "user", createdAt: 1,
      text: "Calculate the synthetic total.",
    }],
    timelinePage: { hasOlderRows },
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
  if (hasOlderRows) {
    // A short channel loads older segments automatically, but stops at the cap.
    await waitFor(() => expect(slot.inspection.sdkCalls.some((call) =>
      call.method === "threads.timeline" && (call.args[0] as { segmentLimit?: string }).segmentLimit === "100",
    )).toBe(true));
  } else {
    await slot.findByText("Calculate the synthetic total.");
  }
  for (const call of slot.inspection.sdkCalls.filter((call) => call.method === "threads.timeline")) {
    expect(call.args[0]).toMatchObject({ includeNestedRows: "true" });
    expect(Number((call.args[0] as { segmentLimit: string }).segmentLimit)).toBeLessThanOrEqual(100);
  }
});
