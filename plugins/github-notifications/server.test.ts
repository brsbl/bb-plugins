import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import { createGithubNotificationsPlugin } from "./server";

describe("GitHub Activity plugin", () => {
  it("registers the feed RPC and serves scoped activity through the harness", async () => {
    const runGh = vi.fn()
      .mockResolvedValueOnce([
        {
          id: "n1",
          reason: "author",
          unread: true,
          updated_at: "2026-08-12T12:00:00Z",
          repository: { full_name: "get-bb/bb" },
          subject: {
            title: "Scannable activity",
            type: "PullRequest",
            url: "https://api.github.com/repos/get-bb/bb/pulls/42",
          },
        },
      ])
      .mockResolvedValueOnce({
        data: {
          viewer: { login: "brsbl" },
          notification0: {
            resource: {
              author: { login: "brsbl" },
              number: 42,
              title: "Scannable activity",
              url: "https://github.com/get-bb/bb/pull/42",
              comments: { nodes: [] },
              reviews: { nodes: [{ author: { login: "alice" }, state: "CHANGES_REQUESTED", submittedAt: "2026-08-12T11:00:00Z" }] },
            },
          },
        },
      });
    const { bb, harness } = createFakePluginHost({ pluginId: "github-notifications" });
    createGithubNotificationsPlugin(runGh)(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual(["listNotifications"]);
    await expect(
      harness.behavior.callRpc("listNotifications", { force: false }),
    ).resolves.toEqual(expect.objectContaining({
      login: "brsbl",
      items: [expect.objectContaining({ activity: "Changes requested", resourceKind: "pr" })],
    }));
    await harness.lifecycle.dispose();
  });
});
