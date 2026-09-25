// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
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
          identityKey: "https://api.github.com/user/1",
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
    const actor = screen.getAllByText("@alice")[0]!.parentElement!;
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
    expect(pullRequestType.className).toContain("text-muted-foreground");
    const issueType = screen.getByLabelText("Issue");
    expect(issueType.querySelector("svg")).not.toBeNull();
    expect(issueType.className).toContain("text-muted-foreground");
    const mentionActivity = screen.getByLabelText("Mention");
    expect(mentionActivity.querySelector("svg")).not.toBeNull();
    expect(mentionActivity.className).toContain("text-warning-text");
    expect(mentionActivity.getAttribute("title")).toBe("Mention");
    const commentActivity = screen.getByLabelText("Comment");
    expect(commentActivity.querySelector("svg")).not.toBeNull();
    expect(commentActivity.className).toContain("text-muted-foreground");
    const updatedTimes = screen.getAllByLabelText(/^Updated /u);
    const inlineUpdatedTime = updatedTimes[0]!;
    const desktopUpdatedTime = updatedTimes[1]!;
    const updatedTime = desktopUpdatedTime;
    expect(updatedTime.getAttribute("title")).toMatch(/^Updated /u);
    expect(updatedTime.querySelector("svg")).toBeNull();
    expect(updatedTime.className).not.toContain("rounded");
    expect(updatedTime.className).not.toContain("bg-muted");
    expect(updatedTime.className).toContain("shrink-0");
    expect(inlineUpdatedTime.closest("td")?.cellIndex).toBe(1);
    expect(desktopUpdatedTime.closest("td")?.cellIndex).toBe(4);
    expect(desktopUpdatedTime.parentElement?.className).toContain(
      "justify-between",
    );
    expect(screen.getAllByText("get-bb/bb")).toHaveLength(2);
    expect(screen.getByText("Scannable activity")).toBeDefined();
    expect(screen.getByText("#42").parentElement?.className).toContain("mt-0.5");
    const link = screen.getByRole("link", { name: /Scannable activity/u });
    expect(link.getAttribute("href")).toBe("https://github.com/get-bb/bb/pull/42");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.className).toContain("items-start");
    expect(screen.getByText("Scannable activity").className).toContain(
      "lg:line-clamp-1",
    );
    expect(inlineUpdatedTime.parentElement?.className).toContain("xl:hidden");
    expect(pullRequestType.closest("td")).toBe(link.closest("td"));
    expect(mentionActivity.closest("td")).not.toBe(link.closest("td"));
    const statusHeader = screen.getByRole("columnheader", { name: "Status" });
    const activityHeader = screen.getByRole("columnheader", { name: "Activity" });
    const resourceHeader = screen.getByRole("columnheader", { name: "Resource" });
    const repoHeader = screen.getByRole("columnheader", { name: "Repo" });
    const fromHeader = screen.getByRole("columnheader", { name: /From/u });
    expect(
      [statusHeader, resourceHeader, repoHeader, activityHeader, fromHeader].map(
        (header) => (header as HTMLTableCellElement).cellIndex,
      ),
    ).toEqual([0, 1, 2, 3, 4]);
    expect(screen.queryByRole("columnheader", { name: /Notification/u })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: /Last updated/u })).toBeNull();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
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
    const row = link.closest("tr")!;
    expect(link.closest("td")?.cellIndex).toBe(1);
    expect(mentionActivity.closest("td")?.cellIndex).toBe(3);
    expect(mentionActivity.closest("td")?.nextElementSibling).toBe(
      desktopUpdatedTime.closest("td"),
    );
    expect(row.querySelector(".github-activity-repo-cell")?.className).toContain(
      "lg:table-cell",
    );
    expect(row.querySelector(".github-activity-from-cell")?.className).toContain(
      "xl:table-cell",
    );
    expect(
      row.querySelector(".github-activity-inline-repo")?.className,
    ).toContain("lg:hidden");
    expect(
      row.querySelector(".github-activity-inline-repo")?.getAttribute(
        "aria-hidden",
      ),
    ).toBeNull();
    expect(inlineUpdatedTime.parentElement?.getAttribute("aria-hidden")).toBeNull();

    const activitySort = screen.getAllByRole("button", {
      name: "Sort by time, descending",
    })[0]!;
    fireEvent.click(activitySort);
    expect(screen.getAllByRole("link")[0]?.textContent).toContain(
      "Keep links local",
    );
    expect(
      screen.getAllByRole("button", { name: "Sort by time, ascending" })[0],
    ).toBeDefined();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Sort by time, ascending" })[0]!,
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
    markResolved.focus();
    fireEvent.click(markResolved);
    await waitFor(() => {
      expect(slot.inspection.rpcCalls).toContainEqual({
        method: "setNotificationResolved",
        input: {
          eventKey: null,
          id: "n1",
          identityKey: "https://api.github.com/user/1",
          resolved: true,
          updatedAt: "2026-08-12T12:00:00Z",
        },
      });
      expect(screen.queryByText("Scannable activity")).toBeNull();
      expect(document.activeElement).toBe(
        screen.getByRole("combobox", { name: "Filter by status" }),
      );
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
        input: {
          eventKey: null,
          id: "n2",
          identityKey: "https://api.github.com/user/1",
          resolved: false,
          updatedAt: "2026-08-11T12:00:00Z",
        },
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

    fireEvent.click(screen.getByRole("button", { name: /Sort by Resource/u }));
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
            identityKey: "https://api.github.com/user/1",
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
  it("announces an initial load failure", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.navPanels[0]!;
    const slot = renderSlot(panel, { subPath: "" }, {
      rpc: {
        listNotifications: () => {
          throw new Error("GitHub authentication failed");
        },
        setNotificationResolved: (input) => input,
      },
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Couldn’t load GitHub activity");
    expect(alert.textContent).toContain("GitHub authentication failed");
    slot.lifecycle.unmount();
  });

  it("keeps and refocuses a row when resolving fails", async () => {
    const app = await loadPluginApp(() => import("./app"));
    const panel = app.navPanels[0]!;
    const slot = renderSlot(panel, { subPath: "" }, {
      rpc: {
        listNotifications: () => ({
          fetchedAt: "2026-08-12T12:00:00Z",
          identityKey: "https://api.github.com/user/1",
          login: "brsbl",
          items: [
            {
              id: "n1",
              activity: "New comment",
              activityKind: "comment" as const,
              actor: "alice",
              avatarUrl: null,
              eventKey: "comment:1",
              number: 42,
              repo: "get-bb/bb",
              resolved: false,
              resourceKind: "pr" as const,
              title: "Retry resolve",
              unread: true,
              updatedAt: "2026-08-12T12:00:00Z",
              url: "https://github.com/get-bb/bb/pull/42",
            },
          ],
        }),
        setNotificationResolved: () => {
          throw new Error("storage unavailable");
        },
      },
    });

    const checkbox = (await screen.findByRole("checkbox", {
      name: "Resolve: Retry resolve",
    })) as HTMLInputElement;
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by status" }),
      { target: { value: "open" } },
    );
    checkbox.focus();
    fireEvent.click(checkbox);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn’t update resolved state",
    );
    await waitFor(() => expect(document.activeElement).toBe(checkbox));
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText("Retry resolve")).toBeDefined();
    slot.lifecycle.unmount();
  });
});
