// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
  PromptThreadStatusController,
  THREAD_ROW_STATUS,
  type PromptRunState,
} from "./thread-status.js";

function createController() {
  const setThreadRowStatus = vi.fn();
  const clearInterval = vi.fn();
  const setInterval = vi.fn(() => 7);
  const controller = new PromptThreadStatusController(setThreadRowStatus, {
    clearInterval,
    setInterval,
  });
  return { clearInterval, controller, setInterval, setThreadRowStatus };
}

describe("PromptThreadStatusController", () => {
  it("uses the shared running appearance and keeps it until the run terminates", async () => {
    const harness = createController();
    let state: PromptRunState = "running";

    harness.controller.track({
      requestId: "req_1",
      threadId: "thr_source",
      getState: async () => state,
    });

    expect(harness.setThreadRowStatus).toHaveBeenLastCalledWith(
      "thr_source",
      THREAD_ROW_STATUS,
    );
    expect(THREAD_ROW_STATUS).toEqual({
      icon: "AiContentGenerator01",
      label: "Improve Prompt is improving the draft",
      tone: "running",
    });

    await harness.controller.reconcileNow();
    expect(harness.setThreadRowStatus).not.toHaveBeenCalledWith(
      "thr_source",
      null,
    );

    state = "terminal";
    await harness.controller.reconcileNow();
    expect(harness.setThreadRowStatus).toHaveBeenLastCalledWith(
      "thr_source",
      null,
    );
    expect(harness.clearInterval).toHaveBeenCalledWith(7);
  });

  it("keeps a thread status until every run owned by that thread ends", async () => {
    const harness = createController();
    let firstState: PromptRunState = "running";
    let secondState: PromptRunState = "running";
    harness.controller.track({
      requestId: "req_1",
      threadId: "thr_source",
      getState: async () => firstState,
    });
    harness.controller.track({
      requestId: "req_2",
      threadId: "thr_source",
      getState: async () => secondState,
    });

    firstState = "terminal";
    await harness.controller.reconcileNow();
    expect(harness.setThreadRowStatus).not.toHaveBeenCalledWith(
      "thr_source",
      null,
    );

    secondState = "terminal";
    await harness.controller.reconcileNow();
    expect(harness.setThreadRowStatus).toHaveBeenLastCalledWith(
      "thr_source",
      null,
    );
  });

  it("clears every owned thread status when the plugin generation disposes", () => {
    const harness = createController();
    harness.controller.track({
      requestId: "req_1",
      threadId: "thr_one",
      getState: async () => "running",
    });
    harness.controller.track({
      requestId: "req_2",
      threadId: "thr_two",
      getState: async () => "running",
    });

    harness.controller.dispose();

    expect(harness.setThreadRowStatus).toHaveBeenCalledWith("thr_one", null);
    expect(harness.setThreadRowStatus).toHaveBeenCalledWith("thr_two", null);
    expect(harness.clearInterval).toHaveBeenCalledWith(7);
  });
});
