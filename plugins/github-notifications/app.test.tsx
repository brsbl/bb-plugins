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
  it("renders each item with compact resource context and a plain-language update", async () => {
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
              resourceKind: "issue",
              title: "Keep links local",
              unread: false,
              updatedAt: "2026-08-11T12:00:00Z",
              url: "https://github.com/brsbl/moss/issues/7",
            },
          ],
        }),
      },
    });
    expect(await slot.findByText("PR #42")).toBeDefined();
    expect(screen.getByText("approved")).toBeDefined();
    const actor = screen.getByText("@alice");
    expect(actor.className).toContain("rounded-full");
    expect(actor.className).toContain("bg-muted/75");
    const approvedStatus = screen.getByLabelText("Approved");
    expect(approvedStatus.querySelector("svg")).not.toBeNull();
    expect(approvedStatus.textContent).toContain("Approved");
    const updatedTime = screen.getAllByLabelText(/^Updated /u)[0]!;
    expect(updatedTime.getAttribute("title")).toMatch(/^Updated /u);
    expect(updatedTime.querySelector("svg")).not.toBeNull();
    expect(updatedTime.className).not.toContain("rounded");
    expect(updatedTime.className).not.toContain("bg-muted");
    expect(screen.getByText("get-bb/bb")).toBeDefined();
    expect(screen.getByText("Scannable activity")).toBeDefined();
    const link = screen.getByRole("link", { name: /Pull request get-bb\/bb number 42/u });
    expect(link.getAttribute("href")).toBe("https://github.com/get-bb/bb/pull/42");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: /Item/u })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Latest update/u })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Updated/u })).toBeDefined();

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
