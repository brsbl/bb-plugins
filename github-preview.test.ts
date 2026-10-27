import { expect, it, vi } from "vitest";
import { PreviewProviders, type ProviderRead } from "./preview-providers.js";
import { githubReference } from "./github-preview.js";
const pr = { number: 7, title: "Improve navigation", body: "Keep the sidebar visible.", state: "open", draft: false, merged_at: null, user: { login: "alex" }, updated_at: "2026-10-20T10:00:00Z", labels: [], assignees: [], comments: 2, head: { ref: "fix/sidebar", sha: "a".repeat(40) }, base: { ref: "main" }, mergeable: true, mergeable_state: "clean", requested_reviewers: [], requested_teams: [] };
const review = { user: { login: "sam" }, state: "APPROVED", submitted_at: "2026-10-20T10:00:00Z" };
const run = { status: "completed", conclusion: "success" };
function reader(item = pr, reviews: unknown = [review], runs: unknown = { total_count: 1, check_runs: [run] }, status: unknown = { state: "success", total_count: 1 }) {
  return vi.fn<ProviderRead>(async url => {
    const body = url.pathname.endsWith('/reviews') ? reviews : url.pathname.endsWith('/check-runs') ? runs : url.pathname.endsWith('/status') ? status : item;
    if (body instanceof Error) throw body;
    return { url, body: Buffer.from(JSON.stringify(body)), contentType: "application/json" };
  });
}
const url = new URL("https://github.com/acme/demo/pull/7/files");
it("uses one bounded PR lookup plus parallel reviews and current-head checks", async () => {
  const read = reader(); const result = await new PreviewProviders().get(url, read);
  expect(result?.github).toMatchObject({ state: "open", author: "alex", branch: "fix/sidebar → main", checks: "Checks passing", review: "1 approval", mergeability: "No conflicts" });
  expect(read).toHaveBeenCalledTimes(4);
  expect(read.mock.calls.every(([u]) => u.origin === "https://api.github.com")).toBe(true);
});
it.each([
  [{ draft: true }, "draft", "No conflicts"],
  [{ state: "closed", draft: true }, "closed", "Closed without merging"],
  [{ state: "closed", merged_at: "2026-10-20" }, "merged", "Merged"],
  [{ mergeable: false }, "open", "Conflicts"],
  [{ mergeable: null }, "open", "Mergeability unknown"],
  [{ mergeable_state: "blocked" }, "open", "Merge blocked"],
])("keeps lifecycle separate from mergeability (%j)", async (fields, state, mergeability) => {
  const result = await new PreviewProviders().get(url, reader({ ...pr, ...fields } as typeof pr));
  expect(result?.github).toMatchObject({ state, mergeability });
});
it.each([
  [{ total_count: 1, check_runs: [{ ...run, conclusion: "failure" }] }, "Checks failing"],
  [{ total_count: 1, check_runs: [{ status: "in_progress", conclusion: null }] }, "Checks pending"],
  [{ total_count: 101, check_runs: [run] }, "Checks incomplete"],
  [{ total_count: 1, check_runs: [{ ...run, conclusion: "future_state" }] }, "Checks unavailable"],
  [{ total_count: 0, check_runs: [] }, "No checks"],
])("does not turn incomplete or unknown checks green (%j)", async (runs, checks) => {
  const result = await new PreviewProviders().get(url, reader(pr, [], runs, { state: "pending", total_count: 0 }));
  expect(result?.github?.checks).toBe(checks);
});
it("uses the latest submitted decision per reviewer and preserves failures of optional fields", async () => {
  const result = await new PreviewProviders().get(url, reader(pr, [review, { ...review, state: "CHANGES_REQUESTED" }], Error('unavailable')));
  expect(result?.github).toMatchObject({ review: "Changes requested", checks: "Checks unavailable" });
  const dismissed = await new PreviewProviders().get(url, reader(pr, [review, { ...review, state: "DISMISSED" }]));
  expect(dismissed?.github?.review).toBe("No approvals");
});
it("does not claim approval when reviews are truncated", async () => {
  expect((await new PreviewProviders().get(url, reader(pr, Array(100).fill(review))))?.github?.review).toBe("Review status unavailable");
});
it("pauses GitHub requests across pins after a rate limit", async () => {
  const providers = new PreviewProviders(() => 1000);
  const read = vi.fn<ProviderRead>(async () => { throw Object.assign(new Error('limited'), { status: 429, retryAt: 9000 }); });
  await expect(providers.get(url, read)).rejects.toMatchObject({ retryAt: 9000 });
  await expect(providers.get(new URL('https://github.com/acme/demo/issues/8'), read)).rejects.toMatchObject({ retryAt: 9000 });
  expect(read).toHaveBeenCalledTimes(1);
});
it("only recognizes validated public GitHub URLs", () => {
  for (const value of ['https://evil.test/acme/demo/pull/7','http://github.com/acme/demo/issues/7','https://github.com:444/acme/demo/issues/7','https://user:password@github.com/acme/demo/pull/7','https://github.com/acme/demo/issues/0']) expect(githubReference(value)).toBeNull();
});
