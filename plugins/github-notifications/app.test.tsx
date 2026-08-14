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
              activity: "Approved",
              activityKind: "approved",
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
            {
              id: "n3",
              activity: "New review",
              activityKind: "review",
              actor: "carol",
              avatarUrl: "https://ghe.example.test/avatars/carol",
              number: 43,
              repo: "get-bb/bb",
              resolved: false,
              resourceKind: "pr",
              title: "Review without duplicate text",
              unread: false,
              updatedAt: "2026-08-10T12:00:00Z",
              url: "https://github.com/get-bb/bb/pull/43",
            },
            {
              id: "n4",
              activity: "Mention",
              activityKind: "mention",
              actor: "dana",
              avatarUrl: null,
              number: 8,
              repo: "brsbl/moss",
              resolved: false,
              resourceKind: "issue",
              title: "Mention without duplicate text",
              unread: false,
              updatedAt: "2026-08-09T12:00:00Z",
              url: "https://github.com/brsbl/moss/issues/8",
            },
          ],
        }),
        setNotificationResolved: (input) => input,
      },
    });
    expect(await slot.findByText("PR #42")).toBeDefined();
    expect(screen.queryByText("approved")).toBeNull();
    expect(screen.queryByText("reviewed")).toBeNull();
    expect(screen.queryByText("mentioned you")).toBeNull();
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
    const approvedStatus = screen.getByLabelText("Approved");
    expect(approvedStatus.querySelector("svg")).not.toBeNull();
    expect(approvedStatus.className).toContain("text-success");
    expect(approvedStatus.className).not.toContain("rounded");
    expect(approvedStatus.className).not.toContain("bg-success");
    expect(approvedStatus.getAttribute("title")).toBe("Approved");
    const updatedTime = screen.getAllByLabelText(/^Updated /u)[0]!;
    expect(updatedTime.getAttribute("title")).toMatch(/^Updated /u);
    expect(updatedTime.querySelector("svg")).toBeNull();
    expect(updatedTime.className).not.toContain("rounded");
    expect(updatedTime.className).not.toContain("bg-muted");
    expect(updatedTime.className).toContain("text-right");
    expect(screen.getAllByText("get-bb/bb")).toHaveLength(2);
    expect(screen.getByText("Scannable activity")).toBeDefined();
    const link = screen.getByRole("link", { name: /Pull request get-bb\/bb number 42/u });
    expect(link.getAttribute("href")).toBe("https://github.com/get-bb/bb/pull/42");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: /Item/u })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Activity/u })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Last updated/u })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeDefined();

    const markResolved = screen.getByRole("button", {
      name: "Resolve: Scannable activity",
    });
    expect(markResolved.getAttribute("aria-pressed")).toBe("false");
    expect(markResolved.getAttribute("title")).toBe("Resolve");
    expect(markResolved.querySelector("svg")?.className.baseVal).toContain(
      "lucide-check",
    );
    const markUnresolved = screen.getByRole("button", {
      name: "Reopen: Keep links local",
    });
    expect(markUnresolved.getAttribute("aria-pressed")).toBe("true");
    expect(markUnresolved.getAttribute("title")).toBe("Reopen");
    expect(markUnresolved.className).toContain("text-success");
    fireEvent.click(markResolved);
    await waitFor(() => {
      expect(slot.inspection.rpcCalls).toContainEqual({
        method: "setNotificationResolved",
        input: { id: "n1", resolved: true },
      });
      expect(
        screen.getByRole("button", {
          name: "Reopen: Scannable activity",
        }),
      ).toBeDefined();
    });

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

    fireEvent.click(screen.getByRole("button", { name: /Sort by Item/u }));
    const links = screen.getAllByRole("link");
    expect(links[0]?.textContent).toContain("Keep links local");

    fireEvent.click(screen.getByRole("button", { name: "Refresh GitHub activity" }));
    await waitFor(() => {
      expect(slot.inspection.rpcCalls.at(-1)).toEqual({ method: "listNotifications", input: { force: true } });
    });
    slot.lifecycle.unmount();
  });
});
