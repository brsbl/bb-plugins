// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

const message = { id: "msg_1", threadId: "thr_issue", turnId: "turn_1", projectId: "proj_1" };
const directiveProps = {
  attributes: { id: "issue_1" },
  source: '::digest-issue{id="issue_1"}',
  message,
  openWorkspaceFile: null,
};
const readyIssue = {
  id: "issue_1",
  digestId: "unread-email",
  threadId: "thr_issue",
  headline: "Two messages need your attention",
  lede: "A quiet morning: **12 unread messages**, with **2 replies** to consider.",
  metrics: [{ label: "Unread", value: "12" }, { label: "Need a reply", value: "2" }],
  details: "The design review needs a reply by Friday.",
  state: "ready",
  recovery: null,
  createdAt: 1_791_000_000_000,
  publishedAt: 1_791_000_000_000,
  readAt: null,
  sources: [],
};
const definition = {
  id: "reading",
  name: "Reading",
  instructions: "Summarize newsletters without marking them read.",
  schedule: { cron: "0 11 * * 0", timezone: "America/Los_Angeles" },
  enabled: false,
  automationId: null,
};

afterEach(cleanup);

describe("Digests app", () => {
  it("shows the newsletter immediately with safe rich text and optional more detail", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.navPanels).toHaveLength(0);
    expect(app.messageDirectives.map((item) => item.id)).toEqual(["digest-issue"]);
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, {
      rpc: { getIssue: () => ({ ...readyIssue,
        lede: "A quiet weekend: **14 new emails**, but only **2 need you**. Google flagged a sign-in to ==confirm today==.",
        details: "## Reply to\n\n[**Felix Rieseberg**](https://example.test/felix) :chip[Anthropic] suggested **Thursday at 3pm**.\n\n[**Review reply**](https://example.test/reply)\n\n## The rest\n\nYour scorecard gained :gain[+12 followers]. An [unsafe link](javascript:alert%281%29) stays inert.\n\n<script>window.untrusted = true</script>\n\n<!-- more -->\n\nEarlier context: `:chip[not a chip]`.",
      }) },
    });
    expect(await slot.findByRole("heading", { name: readyIssue.headline })).toBeDefined();
    expect(slot.getByText("14 new emails").tagName).toBe("STRONG");
    expect(slot.getByText("confirm today").tagName).toBe("MARK");
    expect(slot.getByText("Anthropic").className).toBe("digest-chip");
    expect(slot.getByText("+12 followers").className).toBe("digest-gain");
    expect(slot.getByRole("heading", { name: "Reply to" }).closest("details")).toBeNull();
    expect(slot.getByRole("link", { name: "Felix Rieseberg" }).getAttribute("href")).toBe("https://example.test/felix");
    expect(slot.getByRole("link", { name: "Review reply" }).closest("p")?.className).toBe("digest-item-actions");
    expect(slot.queryByRole("link", { name: "unsafe link" })).toBeNull();
    expect(slot.container.querySelector("script, dl, time")).toBeNull();
    const summary = slot.getByText("More detail");
    const details = summary.closest("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    expect(slot.getByText(":chip[not a chip]").tagName).toBe("CODE");
    fireEvent.click(summary);
    expect(details.open).toBe(false);
    expect(slot.inspection.rpcCalls).toEqual([{ method: "getIssue", input: { threadId: "thr_issue", id: "issue_1" } }]);
  });

  it("keeps a failed issue visible and requires a click to reconnect or retry", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let needsUpdate = true;
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, {
      rpc: {
        getIssue: () => ({ ...readyIssue, state: "failed", recovery: "reconnect", headline: "Gmail is signed out", details: "Reconnect Gmail, then retry this digest." }),
        reconnect: () => ({ message: "Gmail is open in bb Browser. Sign in there, then retry." }),
        retry: () => {
          if (needsUpdate) throw new Error("Update bb to 0.45.0 or later, then retry this issue.");
          return { threadId: "thr_issue" };
        },
      },
    });
    const reconnect = await slot.findByRole("button", { name: "Reconnect" });
    expect(slot.inspection.rpcCalls).toHaveLength(1);
    expect(slot.getByText("Reconnect Gmail, then retry this digest.").closest("details")).toBeNull();
    fireEvent.click(reconnect);
    expect(await slot.findByText("Gmail is open in bb Browser. Sign in there, then retry.")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "reconnect", input: { threadId: "thr_issue", id: "issue_1" } });
    fireEvent.click(slot.getByRole("button", { name: "Retry" }));
    expect((await slot.findByRole("alert")).textContent).toContain("Update bb to 0.45.0 or later, then retry this issue.");
    expect(slot.getByRole("heading", { name: "Gmail is signed out" })).toBeDefined();
    needsUpdate = false;
    fireEvent.click(slot.getByRole("button", { name: "Retry" }));
    expect(await slot.findByText("Retrying this issue.")).toBeDefined();
    expect(slot.inspection.navigateCalls).toContainEqual({ method: "toThread", threadId: "thr_issue" });
  });

  it("recovers a failed initial load and refreshes after missed realtime events", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let calls = 0;
    let headline = readyIssue.headline;
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, {
      rpc: { getIssue: () => {
        calls += 1;
        if (calls === 1) throw new Error("offline");
        return { ...readyIssue, headline };
      } },
      realtimeConnectionState: "connected",
    });
    expect((await slot.findByRole("alert")).textContent).toContain("couldn’t be loaded");
    fireEvent.click(slot.getByRole("button", { name: "Retry" }));
    expect(await slot.findByRole("heading", { name: headline })).toBeDefined();
    headline = "Your digest is now complete";
    await slot.behavior.setRealtimeConnectionState("reconnecting");
    await slot.behavior.setRealtimeConnectionState("connected");
    expect(await slot.findByRole("heading", { name: headline })).toBeDefined();
    headline = "A new update arrived";
    await slot.behavior.emitRealtime("issues", { id: "issue_1" });
    expect(await slot.findByRole("heading", { name: headline })).toBeDefined();
  });

  it("shows Sunday 11am and changes a schedule only after Enable or Pause", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.settingsSections[0]!, {}, {
      rpc: {
        overview: () => ({ definitions: [definition], connections: [{ id: "gmail", name: "Gmail", status: "unknown", detail: null }], actionCardsAvailable: false, organizerReady: true }),
        setEnabled: (input) => ({ ...definition, enabled: (input as { enabled: boolean }).enabled }),
        run: () => ({ threadId: "thr_new_issue" }),
      },
    });
    expect(await slot.findByText("Sundays · 11am PT · Paused")).toBeDefined();
    expect(slot.getByText("Not checked yet")).toBeDefined();
    expect(slot.inspection.rpcCalls).toHaveLength(1);
    fireEvent.click(slot.getByRole("button", { name: "Enable Reading" }));
    await waitFor(() => expect(slot.getByRole("button", { name: "Pause Reading" })).toBeDefined());
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "setEnabled", input: { id: "reading", enabled: true } });
    fireEvent.click(slot.getByRole("button", { name: "Pause Reading" }));
    await waitFor(() => expect(slot.getByRole("button", { name: "Enable Reading" })).toBeDefined());
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "setEnabled", input: { id: "reading", enabled: false } });
    fireEvent.click(slot.getByRole("button", { name: "Run Reading now" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "run", input: { id: "reading" } }));
    expect(slot.inspection.navigateCalls).toContainEqual({ method: "toThread", threadId: "thr_new_issue" });
  });

  it("offers recovery when the agent fails before publishing a directive", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let failed = true;
    const slot = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, {
      composer: { scope: { kind: "thread", threadId: "thr_issue" } },
      rpc: {
        recoveryIssue: () => failed ? {
          ...readyIssue,
          state: "failed",
          recovery: "retry",
          headline: "The digest agent couldn’t start",
          details: "Check your provider connection, then retry this issue.",
        } : null,
        retry: () => {
          failed = false;
          return { threadId: "thr_issue" };
        },
      },
    });
    expect(await slot.findByRole("heading", { name: "The digest agent couldn’t start" })).toBeDefined();
    expect(slot.inspection.rpcCalls).toEqual([{ method: "recoveryIssue", input: { threadId: "thr_issue" } }]);
    fireEvent.click(slot.getByRole("button", { name: "Retry" }));
    expect(await slot.findByText("Retrying this issue.")).toBeDefined();
    await slot.behavior.emitRealtime("issues", { id: "issue_1" });
    await waitFor(() => expect(slot.queryByRole("article", { name: "Digest summary" })).toBeNull());
  });
});
