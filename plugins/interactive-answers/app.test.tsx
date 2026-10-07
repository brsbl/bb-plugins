// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, expect, it } from "vitest";
import { bill } from "./examples.js";

const answer = { id: "e85d6718-895b-48e5-8bc4-2a9bd3477895", threadId: "thr_test", document: bill };
afterEach(() => { cleanup(); localStorage.clear(); });
it("updates results locally, restores valid inputs on remount, resets, and switches representations", async () => {
  await loadPluginApp(() => import("./app.js"));
  const { AnswerView } = await import("./app.js");
  const first = render(<AnswerView answer={answer} />);
  expect(screen.getByText("$36.00")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("People"), { target: { value: "6" } });
  expect(screen.getByText("$24.00", { selector: "dd" })).toBeTruthy();
  first.unmount();
  render(<AnswerView answer={answer} />);
  expect(screen.getByText("$24.00", { selector: "dd" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("People"), { target: { value: "0" } });
  expect(screen.getByRole("alert").textContent).toContain("last valid value");
  expect(screen.getByText("$24.00", { selector: "dd" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset inputs" }));
  expect(screen.getByText("$36.00")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.change(screen.getByLabelText("Breakdown"), { target: { value: "table" } });
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByRole("table")).toBeTruthy();
});
it("uses the enclosing message thread for retrieval and recovers from a failed load", async () => {
  const app = await loadPluginApp(() => import("./app.js"));
  let failed = true;
  const view = renderSlot(app.messageDirectives[0]!, { attributes: { id: answer.id, thread: "thr_other" }, source: "", message: { id: "msg_1", threadId: answer.threadId, turnId: null, projectId: null }, openWorkspaceFile: null }, { rpc: { get: (input) => { expect(input).toEqual({ id: answer.id, threadId: answer.threadId }); if (failed) throw new Error("Offline"); return answer; } } });
  await view.findByText("Offline");
  failed = false;
  fireEvent.click(view.getByRole("button", { name: "Retry" }));
  await view.findByText(bill.title);
  expect(view.inspection.rpcCalls).toHaveLength(2);
  view.lifecycle.unmount();
});
