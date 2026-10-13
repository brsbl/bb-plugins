// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, expect, it } from "vitest";
import plugin from "./server.js";

const draft = "My unfinished message — keep this exactly.\nSecond line.";
const contents = {
  decide: { type: "decide", question: "Publish notes?", consequence: "Publish the notes", yesLabel: "Publish" },
  choice: { type: "choice", question: "Which format?", options: [{ id: "short", label: "Short" }, { id: "long", label: "Long" }] },
  reply: { type: "reply", summary: "Reply to the editor", to: ["editor@example.invalid"], cc: [], bcc: [], subject: "Notes", original: { from: "editor@example.invalid", body: "Ready?" }, draft: "Ready for review." },
} as const;
afterEach(cleanup);
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

it.each(["decide", "choice", "reply", "sheet"] as const)("submits a %s independently while preserving the composer draft", async (kind) => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards", sdk: { threads: { send: () => ({ kind: "queued" }) } } });
  plugin(host.bb);
  try {
    const ids = kind === "sheet" ? ["one", "two"] : ["one"];
    for (const id of ids) await host.harness.behavior.runCli(["create", id, "--thread", "thr_test", "--item", JSON.stringify(contents[kind === "sheet" ? "decide" : kind])]);
    if (kind === "sheet") await host.harness.behavior.runCli(["create-table", "sheet", "--thread", "thr_test", "--table", JSON.stringify({ title: "Publication", ids })]);
    const app = await loadPluginApp(() => import("./app.js"));
    const rpc = Object.fromEntries(["get", "table", "prepare", "choose", "prepareBatch", "comment", "dispatch", "submitted"].map((name) => [name, (input: unknown) => host.harness.behavior.callRpc(name, input)]));
    const slot = renderSlot(app.messageDirectives[kind === "sheet" ? 1 : 0]!, { attributes: { id: kind === "sheet" ? "sheet" : "one" }, source: "", message: { id: "msg_1", threadId: "thr_test", turnId: null, projectId: null }, openWorkspaceFile: null }, {
      composer: { scope: { kind: "thread", threadId: "thr_test" }, text: draft }, rpc,
    });
    const label = kind === "reply" ? "Send" : kind === "choice" ? "Short" : "Publish";
    const options = await screen.findAllByRole("radio", { name: label });
    options.forEach((option) => fireEvent.click(option));
    const form = screen.getByRole("form");
    fireEvent.click(within(form).getByRole("button", { name: /^Submit/ }));
    await waitFor(() => expect(host.harness.sdk.callsTo("threads.send")).toHaveLength(1));
    expect(slot.inspection.composer.text).toBe(draft);
    expect(slot.inspection.composer.submits).toHaveLength(0);
    const request = host.harness.sdk.callsTo("threads.send")[0]![0];
    expect(request).toMatchObject({ threadId: "thr_test", mode: "queue-if-active" });
    expect(JSON.stringify(request)).not.toContain(draft);
    for (const id of ids) {
      const item = JSON.parse((await host.harness.behavior.runCli(["get", id, "--thread", "thr_test"])).stdout!);
      expect(item.attempt.sentAt).toBeTruthy();
    }
    slot.lifecycle.unmount();
  } finally { await host.harness.lifecycle.dispose(); }
});
