import { expect, it } from "vitest";
import { fetchPrState, githubPullRequest, isFresh } from "./pr-state.js";

it("recognizes GitHub pull request URLs, including their tabs", () => {
  expect(githubPullRequest("https://github.com/get-bb/bb/pull/5075")).toEqual({ owner: "get-bb", repo: "bb", number: 5075 });
  expect(githubPullRequest("https://www.github.com/brsbl/bb-plugins/pull/388/files#diff")).toEqual({ owner: "brsbl", repo: "bb-plugins", number: 388 });
  for (const url of ["https://github.com/get-bb/bb/issues/5", "https://github.com/get-bb/bb/pulls", "https://github.com/get-bb/bb/pull/0",
    "http://github.com/get-bb/bb/pull/1", "https://gist.github.com/a/b/pull/1", "https://github.com.evil.dev/a/b/pull/1", "not a url"]) {
    expect(githubPullRequest(url)).toBeNull();
  }
});

it("rechecks open and draft PRs after ten minutes, closed ones hourly, and never a merged one", () => {
  const now = 1_000_000_000;
  expect(isFresh({ state: "open", checkedAt: now - 9 * 60_000 }, now)).toBe(true);
  expect(isFresh({ state: "draft", checkedAt: now - 11 * 60_000 }, now)).toBe(false);
  expect(isFresh({ state: "closed", checkedAt: now - 30 * 60_000 }, now)).toBe(true);
  expect(isFresh({ state: null, checkedAt: now - 61 * 60_000 }, now)).toBe(false);
  expect(isFresh({ state: "merged", checkedAt: 0 }, now)).toBe(true);
});

it("maps GitHub's pull to a state, treats a 404 as unknown, and throws when GitHub can't answer", async () => {
  const answer = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });
  const pr = { owner: "a", repo: "b", number: 1 };
  expect(await fetchPrState(pr, answer(200, { state: "open", draft: false, merged_at: null }))).toBe("open");
  expect(await fetchPrState(pr, answer(200, { state: "open", draft: true, merged_at: null }))).toBe("draft");
  expect(await fetchPrState(pr, answer(200, { state: "closed", draft: false, merged_at: "2026-10-07T00:00:00Z" }))).toBe("merged");
  expect(await fetchPrState(pr, answer(200, { state: "closed", draft: false, merged_at: null }))).toBe("closed");
  expect(await fetchPrState(pr, answer(404, { message: "Not Found" }))).toBeNull();
  await expect(fetchPrState(pr, answer(403, { message: "rate limited" }))).rejects.toThrow("403");
});
