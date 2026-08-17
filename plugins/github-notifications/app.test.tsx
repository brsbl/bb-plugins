// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => cleanup());

describe("GitHub Activity panel", () => {
  it("renders scannable identity-first activity and resolves an item", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.navPanels[0]!;
    const slot = renderSlot(panel, { subPath: "" }, {
      rpc: {
        listNotifications: () => ({
          fetchedAt: "2026-08-12T12:00:00Z",
          login: "brsbl",
          items: [
            {
              id: "n1",
              activity: "Mention",
              activityKind: "mention",
              actor: "alice",
              avatarUrl: "https://ghe.example.test/avatars/alice",
              number: 42,
              repo: "get-bb/bb",
              resolved: false,
              resourceKind: "pr",
              title: "Scannable activity",
              unread: true,
              updatedAt: "2026-08-12T12:00:00Z",
              url: "https://github.com/get-bb/bb/pull/42",
            },
            {
              id: "n2",
              activity: "New comment",
              activityKind: "comment",
              actor: "bob",
              avatarUrl: null,
              number: 7,
              repo: "brsbl/moss",
              resolved: true,
              resourceKind: "issue",
              title: "Keep links local",
              unread: false,
              updatedAt: "2026-08-11T12:00:00Z",
              url: "https://github.com/brsbl/moss/issues/7",
            },
          ],
        }),
        setNotificationResolved: (input) => input,
      },
    });
    expect(await slot.findByText("#42")).toBeDefined();
    expect(screen.queryByText("mentioned you")).toBeNull();
    expect(screen.queryByText("commented")).toBeNull();
    const actor = screen.getByText("@alice").parentElement!;
    expect(actor.className).toContain("rounded-full");
    expect(actor.className).toContain("bg-muted/35");
    expect(actor.className).toContain("font-normal");
    expect(actor.className).toContain("text-muted-foreground");
    const avatarImage = actor.querySelector(
      'img[src="https://ghe.example.test/avatars/alice"]',
    );
    expect(avatarImage).not.toBeNull();
    fireEvent.error(avatarImage!);
    expect(actor.querySelector("img")).toBeNull();
    expect(actor.querySelector("svg")).not.toBeNull();
    const pullRequestType = screen.getByLabelText("Pull request");
    expect(pullRequestType.querySelector("svg")).not.toBeNull();
    expect(pullRequestType.getAttribute("title")).toBe("Pull request");
    const issueType = screen.getByLabelText("Issue");
    expect(issueType.querySelector("svg")).not.toBeNull();
    const mentionActivity = screen.getByLabelText("Mention");
    expect(mentionActivity.querySelector("svg")).not.toBeNull();
    expect(mentionActivity.className).toContain("text-warning-text");
    expect(mentionActivity.getAttribute("title")).toBe("Mention");
    const commentActivity = screen.getByLabelText("Comment");
    expect(commentActivity.querySelector("svg")).not.toBeNull();
    const updatedTime = screen.getAllByLabelText(/^Updated /u)[0]!;
    expect(updatedTime.getAttribute("title")).toMatch(/^Updated /u);
    expect(updatedTime.querySelector("svg")).toBeNull();
    expect(updatedTime.className).not.toContain("rounded");
    expect(updatedTime.className).not.toContain("bg-muted");
    expect(updatedTime.className).toContain("shrink-0");
    expect(updatedTime.closest("td")?.cellIndex).toBe(3);
    expect(screen.getAllByText("get-bb/bb")).toHaveLength(1);
    expect(screen.getByText("Scannable activity")).toBeDefined();
    const link = screen.getByRole("link", { name: /Pull request get-bb\/bb number 42/u });
    expect(link.getAttribute("href")).toBe("https://github.com/get-bb/bb/pull/42");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(pullRequestType.closest("td")).not.toBe(link.closest("td"));
    expect(mentionActivity.closest("td")).not.toBe(link.closest("td"));
    expect(screen.getByRole("columnheader", { name: "Resource" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Activity" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Notification/u })).toBeDefined();
    expect(screen.queryByRole("columnheader", { name: /Last updated/u })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeDefined();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(
      screen.getByRole("combobox", { name: "Filter by status" }),
    ).toBeDefined();
    expect(screen.queryByRole("option", { name: "Reviews" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Approvals" })).toBeNull();
    expect(
      screen.queryByRole("option", { name: "Changes requested" }),
    ).toBeNull();
    expect(screen.getByRole("table").className).not.toContain("min-w-[620px]");
    expect(link.closest("tr")?.className).not.toContain("@max-[36rem]:grid");
    expect(updatedTime.closest("td")).toBe(link.closest("td"));

    const activitySort = screen.getByRole("button", {
      name: "Sort by time, descending",
    });
    fireEvent.click(activitySort);
    expect(screen.getAllByRole("link")[0]?.textContent).toContain(
      "Keep links local",
    );
    expect(
      screen.getByRole("button", { name: "Sort by time, ascending" }),
    ).toBeDefined();
    fireEvent.click(
      screen.getByRole("button", { name: "Sort by time, ascending" }),
    );
    expect(screen.getAllByRole("link")[0]?.textContent).toContain(
      "Scannable activity",
    );

    const markResolved = screen.getByRole("checkbox", {
      name: "Resolve: Scannable activity",
    }) as HTMLInputElement;
    expect(markResolved.checked).toBe(false);
    expect(markResolved.getAttribute("title")).toBe("Resolve");
    expect(markResolved.className).toContain("border-muted-foreground/50");
    expect(markResolved.parentElement?.querySelector("span")?.className).toContain(
      "left-0",
    );
    expect(markResolved.parentElement?.querySelector("span")?.className).toContain(
      "peer-focus-visible:opacity-100",
    );
    const markUnresolved = screen.getByRole("checkbox", {
      name: "Reopen: Keep links local",
    }) as HTMLInputElement;
    expect(markUnresolved.checked).toBe(true);
    expect(markUnresolved.getAttribute("title")).toBe("Reopen");
    expect(markUnresolved.className).toContain("checked:bg-success");
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by status" }),
      { target: { value: "open" } },
    );
    fireEvent.click(markResolved);
    await waitFor(() => {
      expect(slot.inspection.rpcCalls).toContainEqual({
        method: "setNotificationResolved",
        input: { id: "n1", resolved: true },
      });
      expect(screen.queryByText("Scannable activity")).toBeNull();
    });

    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by status" }),
      { target: { value: "resolved" } },
    );
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Reopen: Scannable activity",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Reopen: Keep links local" }),
    );
    await waitFor(() => {
      expect(slot.inspection.rpcCalls).toContainEqual({
        method: "setNotificationResolved",
        input: { id: "n2", resolved: false },
      });
      expect(screen.queryByText("Keep links local")).toBeNull();
    });

    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by status" }),
      { target: { value: "open" } },
    );
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Resolve: Keep links local",
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);

    fireEvent.change(screen.getByRole("combobox", { name: "Filter by resource type" }), {
      target: { value: "issue" },
    });
    expect(screen.queryByText("Scannable activity")).toBeNull();
    expect(screen.getByText("Keep links local")).toBeDefined();

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter GitHub activity" }), {
      target: { value: "not present" },
    });
    expect(screen.getByText("No matching activity")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Scannable activity")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Sort by Notification/u }));
    const links = screen.getAllByRole("link");
    expect(links[0]?.textContent).toContain("Keep links local");

    fireEvent.click(screen.getByRole("button", { name: "Refresh GitHub activity" }));
    await waitFor(() => {
      expect(slot.inspection.rpcCalls.at(-1)).toEqual({ method: "listNotifications", input: { force: true } });
    });
    slot.lifecycle.unmount();
  });
  it("keeps cached activity visible when a refresh fails", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.navPanels[0]!;
    let calls = 0;
    const slot = renderSlot(panel, { subPath: "" }, {
      rpc: {
        listNotifications: () => {
          calls += 1;
          if (calls > 1) throw new Error("GitHub is temporarily unavailable");
          return {
            fetchedAt: "2026-08-12T12:00:00Z",
            login: "brsbl",
            items: [
              {
                id: "n1",
                activity: "New comment",
                activityKind: "comment" as const,
                actor: "alice",
                avatarUrl: null,
                number: 42,
                repo: "get-bb/bb",
                resolved: false,
                resourceKind: "pr" as const,
                title: "Keep stale activity visible",
                unread: true,
                updatedAt: "2026-08-12T12:00:00Z",
                url: "https://github.com/get-bb/bb/pull/42",
              },
            ],
          };
        },
        setNotificationResolved: (input) => input,
      },
    });

    expect(await slot.findByText("Keep stale activity visible")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Refresh GitHub activity" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn’t refresh GitHub activity",
    );
    expect(screen.getByText("Keep stale activity visible")).toBeDefined();
    expect(screen.queryByText("Couldn’t load GitHub activity")).toBeNull();
    slot.lifecycle.unmount();
  });
});
