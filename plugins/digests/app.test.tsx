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
  instructions: "My unread newsletters.",
  connectionIds: ["gmail"],
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
        details: "## Reply to\n\n[**Felix Rieseberg**](https://example.test/felix) :chip[Anthropic] suggested **Thursday at 3pm**.\n\n**[Review reply](https://example.test/reply)**\n\n## The rest\n\nYour scorecard gained :gain[+12 followers]. An [unsafe link](javascript:alert%281%29) stays inert.\n\n<script>window.untrusted = true</script>\n\n<!-- more -->\n\nEarlier context: `:chip[not a chip]`.",
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
    let retrying = false;
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, {
      rpc: {
        getIssue: () => retrying ? { ...readyIssue, state: "collecting", headline: "Preparing Unread email" } : ({ ...readyIssue, state: "failed", recovery: "reconnect", headline: "Gmail is signed out", details: "Reconnect Gmail, then retry this brief." }),
        reconnect: () => ({ message: "Gmail is open in bb Browser. Sign in there, then retry." }),
        retry: () => {
          if (needsUpdate) throw new Error("Update bb to 0.45.0 or later, then retry this issue.");
          retrying = true;
          return { threadId: "thr_issue" };
        },
      },
    });
    const reconnect = await slot.findByRole("button", { name: "Reconnect" });
    expect(slot.inspection.rpcCalls).toHaveLength(1);
    expect(slot.getByText("Reconnect Gmail, then retry this brief.").closest("details")).toBeNull();
    fireEvent.click(reconnect);
    expect(await slot.findByText("Gmail is open in bb Browser. Sign in there, then retry.")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "reconnect", input: { threadId: "thr_issue", id: "issue_1" } });
    fireEvent.click(slot.getByRole("button", { name: "Retry" }));
    expect((await slot.findByRole("alert")).textContent).toContain("Update bb to 0.45.0 or later, then retry this issue.");
    expect(slot.getByRole("heading", { name: "Gmail is signed out" })).toBeDefined();
    needsUpdate = false;
    fireEvent.click(slot.getByRole("button", { name: "Retry" }));
    expect(await slot.findByRole("heading", { name: "Preparing Unread email" })).toBeDefined();
    expect(slot.queryByRole("heading", { name: "Gmail is signed out" })).toBeNull();
    expect(slot.inspection.navigateCalls).toContainEqual({ method: "toThread", threadId: "thr_issue" });
  });

  it("keeps one live card across a recovery banner and repeated retry directives", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let issue = { ...readyIssue, state: "failed", recovery: "retry", headline: "This brief needs your attention" };
    const rpc = { getIssue: () => issue, recoveryIssue: () => issue };
    const banner = renderSlot(app.composerCustomizations[0]!.banners![0]!, {}, { composer: { scope: { kind: "thread", threadId: "thr_issue" } }, rpc });
    const first = renderSlot(app.messageDirectives[0]!, directiveProps, { rpc });
    const second = renderSlot(app.messageDirectives[0]!, { ...directiveProps, message: { ...message, id: "msg_retry" } }, { rpc });
    await waitFor(() => expect(document.querySelectorAll("article.digest-issue")).toHaveLength(1));
    expect(first.container.querySelector("article")).not.toBeNull();
    expect(banner.container.querySelector("article")).toBeNull();
    expect(second.container.querySelector("article")).toBeNull();
    issue = { ...issue, state: "collecting", headline: "Preparing Unread email" };
    for (const slot of [first, second, banner]) await slot.behavior.emitRealtime("issues", { id: "issue_1" });
    await waitFor(() => expect(first.getByRole("heading").textContent).toBe("Preparing Unread email"));
    expect(document.querySelectorAll("article.digest-issue")).toHaveLength(1);
    issue = { ...issue, state: "ready", headline: readyIssue.headline };
    for (const slot of [first, second, banner]) await slot.behavior.emitRealtime("issues", { id: "issue_1" });
    expect(await first.findByRole("heading", { name: readyIssue.headline })).toBeDefined();
    expect(document.querySelectorAll("article.digest-issue")).toHaveLength(1);
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

  it("shows Sunday 11am and changes a schedule only after its switch is clicked", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.settingsSections[0]!, {}, {
      rpc: {
        overview: () => ({ definitions: [definition], connections: [{ id: "gmail", name: "Gmail", status: "unknown", detail: null }], actionCardsAvailable: false, organizerReady: true }),
        setEnabled: (input) => ({ ...definition, enabled: (input as { enabled: boolean }).enabled }),
        run: () => ({ threadId: "thr_new_issue" }),
      },
    });
    expect(await slot.findByText("Sundays · 11am PT")).toBeDefined();
    expect(slot.getByText("Not checked")).toBeDefined();
    expect(slot.inspection.rpcCalls.some((call) => call.method === "setEnabled")).toBe(false);
    fireEvent.click(slot.getByRole("switch", { name: "Reading schedule", checked: false }));
    await waitFor(() => expect(slot.getByRole("switch", { name: "Reading schedule", checked: true })).toBeDefined());
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "setEnabled", input: { id: "reading", enabled: true } });
    fireEvent.click(slot.getByRole("switch", { name: "Reading schedule", checked: true }));
    await waitFor(() => expect(slot.getByRole("switch", { name: "Reading schedule", checked: false })).toBeDefined());
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "setEnabled", input: { id: "reading", enabled: false } });
    fireEvent.click(slot.getByRole("button", { name: "Run Reading now" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "run", input: { id: "reading" } }));
    expect(slot.inspection.navigateCalls).toContainEqual({ method: "toThread", threadId: "thr_new_issue" });
  });

  it("retries the failed digest from its persisted Settings error without enabling it", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.settingsSections[0]!, {}, { rpc: {
      overview: () => ({ definitions: [definition], connections: [{ id: "gmail", name: "Gmail", status: "unknown" }], organizerReady: true, actionCardsAvailable: false, runErrors: { reading: "My Mac is offline. Open bb on that computer, then Retry." } }),
      run: () => ({ threadId: "thr_retry" }),
    } });
    fireEvent.click(await slot.findByRole("button", { name: "Retry" }));
    await waitFor(() => expect(slot.inspection.navigateCalls).toContainEqual({ method: "toThread", threadId: "thr_retry" }));
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "run", input: { id: "reading" } });
    expect(slot.inspection.rpcCalls.some((call) => call.method === "setEnabled")).toBe(false);
  });

  it("opens a dispatched issue even when realtime clears pending before its response arrives", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let startingIds = ["reading"];
    let finish: ((value: { threadId: string }) => void) | undefined;
    const slot = renderSlot(app.settingsSections[0]!, {}, { rpc: {
      overview: () => ({ definitions: [definition], connections: [{ id: "gmail", name: "Gmail", status: "unknown" }], organizerReady: true, actionCardsAvailable: false, startingIds }),
      runStatus: () => new Promise((resolve) => { finish = resolve; }),
    } });
    await waitFor(() => expect(finish).toBeDefined(), { timeout: 2000 });
    startingIds = [];
    await slot.behavior.emitRealtime("issues", {});
    await waitFor(() => expect(slot.queryByText("Starting this brief…")).toBeNull());
    finish!({ threadId: "thr_async" });
    await waitFor(() => expect(slot.inspection.navigateCalls).toContainEqual({ method: "toThread", threadId: "thr_async" }));
  });

  it("checks sites automatically, persists banner dismissal, and retains the import link", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const connections = [{ id: "gmail", name: "Gmail", status: "signed-out", detail: null }, { id: "x", name: "X", status: "unknown", detail: null }];
    const slot = renderSlot(app.settingsSections[0]!, {}, { rpc: {
      overview: () => ({ definitions: [definition], connections, actionCardsAvailable: false, organizerReady: true }),
      settingsPreferences: () => ({ importBannerDismissed: false }),
      dismissImportBanner: () => true,
      checkSettingsConnections: () => { connections[1]!.status = "signed-in"; return connections; },
    } });
    expect((await slot.findByRole("link", { name: "Import logins in Browser settings →" })).getAttribute("href")).toBe("/settings/browser");
    expect(slot.getByRole("link", { name: "Reconnect" }).getAttribute("href")).toBe("/settings/browser");
    expect(slot.getByText("Reading")).toBeDefined();
    expect(slot.queryByRole("region", { name: "X" })).toBeNull();
    expect(slot.queryByRole("button", { name: "Check sign-ins" })).toBeNull();
    await slot.findByRole("region", { name: "X" });
    expect(slot.getByRole("link", { name: "Import logins in Browser settings →" }).getAttribute("href")).toBe("/settings/browser");
    expect(slot.getByRole("region", { name: "X" })).toBeDefined();
    expect(slot.inspection.rpcCalls.filter((call) => call.method === "checkSettingsConnections")).toHaveLength(1);
    fireEvent.click(slot.getByRole("button", { name: "Dismiss login banner" }));
    await waitFor(() => expect(slot.queryByRole("link", { name: "Import logins in Browser settings →" })).toBeNull());
    expect(slot.getByRole("link", { name: "Import logins →" }).getAttribute("href")).toBe("/settings/browser");
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "dismissImportBanner", input: {} });
  });

  it("creates a prompt digest at 10am and edits the same nested row", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let definitions: typeof definition[] = [];
    const slot = renderSlot(app.settingsSections[0]!, {}, { rpc: {
      overview: () => ({ definitions, connections: [{ id: "gmail", name: "Gmail", status: "signed-in" }], organizerReady: true, actionCardsAvailable: false }),
      saveDigest: (input) => {
        const value = input as { name: string; instructions: string; schedule: typeof definition.schedule };
        const saved = { ...definition, ...value, id: "digest-new", emoji: "💌", enabled: true };
        definitions = [saved]; return saved;
      },
    } });
    fireEvent.click(await slot.findByRole("button", { name: "+ Add brief" }));
    const name = slot.getByLabelText("Name");
    expect(document.activeElement).toBe(name);
    expect(slot.getByLabelText("Emoji")).toBeDefined();
    expect((slot.getByLabelText("After reading") as HTMLSelectElement).value).toBe("keep-unread");
    fireEvent.change(name, { target: { value: "My inbox" } });
    fireEvent.change(slot.getByLabelText("What should it tell you?"), { target: { value: "Only messages that need a reply." } });
    fireEvent.click(slot.getByRole("button", { name: "Create brief" }));
    expect(await slot.findByText("Run now to preview")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "saveDigest", input: { name: "My inbox", emoji: "📰", instructions: "Only messages that need a reply.", connectionId: "gmail", afterReading: "keep-unread", schedule: { cron: "0 10 * * 1-5", timezone: "America/Los_Angeles" } } });
    expect(slot.getByText("Only messages that need a reply.").className).toContain("digest-prompt-preview");
    expect(slot.getByRole("heading", { name: "My inbox" }).textContent).toBe("My inbox");
    fireEvent.click(slot.getByRole("button", { name: "Edit My inbox" }));
    expect(slot.getByLabelText("Emoji")).toBeDefined();
    fireEvent.change(slot.getByLabelText("Name"), { target: { value: "Replies" } });
    fireEvent.change(slot.getByLabelText("Emoji"), { target: { value: "📮" } });
    fireEvent.change(slot.getByLabelText("After reading"), { target: { value: "mark-read" } });
    fireEvent.click(slot.getByRole("button", { name: "Save changes" }));
    expect(await slot.findByRole("button", { name: "Edit Replies" })).toBeDefined();
    expect(slot.inspection.rpcCalls.filter((call) => call.method === "saveDigest").at(-1)?.input).toMatchObject({ id: "digest-new", name: "Replies", emoji: "📮", afterReading: "mark-read" });
  });

  it("shows source rows and a collapsed tail without performing account actions", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, { rpc: { getIssue: () => ({ ...readyIssue, brief: {
      heading: "Needs you", items: [{ title: "Reply to Felix", text: "Coffee Thursday at 3pm.", urgency: "today", action: { label: "Review reply", url: "https://example.test/reply" } }],
      later: [], laterLabel: "Later", tail: { label: "12 routine emails", details: "Receipts and newsletters." },
    } }) } });
    const action = await slot.findByRole("button", { name: "Review reply" });
    expect(action.className).toContain("digest-button-outline");
    expect(slot.container.querySelector<HTMLDetailsElement>("details[id$='-tail']")?.open).toBe(false);
    fireEvent.click(action);
    expect(slot.inspection.rpcCalls).toHaveLength(1);
    expect(slot.inspection.navigateCalls).toContainEqual({ method: "openUrl", url: "https://example.test/reply" });
  });

  it("opens one email section at a time from counts and preserves source links", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, { rpc: { getIssue: () => ({ ...readyIssue, brief: {
      summaryLinks: [{ label: "4 unread emails", section: "all" }, { label: "2 routine", section: "tail" }],
      heading: "Needs you", items: [], later: [], laterLabel: "Later",
      all: { label: "All unread (4)", items: [{ title: "Meeting", text: "Confirm Thursday.", url: "https://example.test/meeting" }] },
      tail: { label: "Routine (2)", details: "Old Markdown fallback.", items: [
        { title: "Amex · Autopay processed", text: "Payment complete.", url: "https://example.test/amex" },
        { title: "Newsletter · This week", text: "Product news.", url: "https://example.test/news" },
      ] },
    } }) } });
    fireEvent.click(await slot.findByRole("link", { name: "2 need nothing from you" }));
    expect(slot.container.querySelector<HTMLDetailsElement>("details[id$='-tail']")?.open).toBe(true);
    expect(document.activeElement).toBe(slot.container.querySelector("details[id$='-tail'] > summary"));
    fireEvent.click(slot.getByRole("link", { name: /Amex · Autopay processed/ }));
    fireEvent.click(slot.getByRole("link", { name: "4 unread emails" }));
    expect(slot.inspection.navigateCalls).toEqual([
      { method: "openUrl", url: "https://example.test/amex" },
    ]);
    expect(slot.getByText("All unread").closest("details")?.open).toBe(true);
    expect(slot.container.querySelector<HTMLDetailsElement>("details[id$='-tail']")?.open).toBe(false);
    expect(document.activeElement).toBe(slot.getByText("All unread").closest("summary"));
    expect(slot.queryByText("Old Markdown fallback.")).toBeNull();
  });

  it("keeps repeat senders flat and preserves every source link and semantic accent", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const rows = ["Robinhood", "Figma", "robinhood", "Robinhood", "Figma"].map((sender, index) => ({
      title: `${sender} · Notice ${index}`, text: index === 2 ? "September statement is ready." : `Detail ${index}`, url: `https://example.test/mail/${index}`,
      ...(index === 0 ? { kind: "receipt", receivedAt: 1791043200000 } : {}),
    }));
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, { rpc: { getIssue: () => ({ ...readyIssue, brief: {
      heading: "Needs you", items: [
        { title: "Reply to Felix", text: "Confirm Thursday.", action: { label: "Review reply", url: "https://example.test/reply" } },
        { title: "Check a new sign-in", tone: "danger", text: "An unfamiliar device.", action: { label: "Review alert", url: "https://example.test/alert" } },
      ], later: [], laterLabel: "Later", tail: { label: "Routine (5)", details: "", items: rows },
    } }) } });
    expect((await slot.findByRole("button", { name: "Review reply" })).closest("li")?.dataset.tone).toBe("warning");
    expect(slot.getByRole("button", { name: "Review alert" }).closest("li")?.dataset.tone).toBe("danger");
    const summary = slot.container.querySelector("details[id$='-tail'] > summary")!;
    expect(summary.querySelector(".digest-count")?.textContent).toBe("5");
    expect(summary.textContent).not.toContain("(5)");
    expect(summary.querySelector(".digest-chevron")).not.toBeNull();
    fireEvent.click(summary);
    expect(slot.container.querySelectorAll("details details")).toHaveLength(0);
    expect(slot.getAllByRole("row")).toHaveLength(rows.length + 1);
    expect(slot.getByText("Receipt")).toBeDefined();
    expect(slot.getByText("Statement")).toBeDefined();
    expect(slot.getByText("Account")).toBeDefined();
    expect(slot.container.querySelectorAll(".digest-email-kind")).toHaveLength(3);
    expect(slot.container.querySelectorAll("time")).toHaveLength(1);
    expect(slot.container.querySelector("time")?.dateTime).toBe(new Date(1791043200000).toISOString());
    for (let index = 0; index < rows.length; index++) {
      fireEvent.click(slot.getByRole("link", { name: new RegExp(`Notice ${index}`) }));
      expect(slot.inspection.navigateCalls).toContainEqual({ method: "openUrl", url: rows[index]!.url });
    }
  });

  it("keeps an unverified unread restoration visible even in a published issue", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, { rpc: { getIssue: () => ({ ...readyIssue,
      emailReads: [{ messageId: "mail1", title: "Payment receipt", url: "https://example.test/mail1", wasUnread: true, afterReading: "keep-unread", status: "opening" }],
    }) } });
    expect((await slot.findByRole("alert")).textContent).toContain("Couldn’t confirm 1 email is unread again");
    expect(slot.getByRole("link", { name: "Payment receipt" }).getAttribute("href")).toBe("https://example.test/mail1");
  });

  it.each([
    [undefined, null],
    ["Today", null],
    ["Due Thu 3pm", "Due Thu 3pm"],
    ["This week", "This week"],
  ])("only shows a source deadline that adds to the headline: %s", async (deadline, expected) => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.messageDirectives[0]!, directiveProps, { rpc: { getIssue: () => ({ ...readyIssue,
      headline: "2 things need you today", brief: {
        heading: "Needs you", items: [{ title: "Confirm the meeting", text: "Confirm the time.", urgency: "today", ...(deadline ? { deadline } : {}), action: { label: "Review", url: "https://example.test/review" } }],
        later: [], laterLabel: "Later",
      },
    }) } });
    await slot.findByRole("button", { name: "Review" });
    expect(document.querySelector(".digest-urgency")?.textContent ?? null).toBe(expected);
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
    await slot.behavior.emitRealtime("issues", { id: "issue_1" });
    await waitFor(() => expect(slot.queryByRole("article", { name: "Brief summary" })).toBeNull());
  });
});
