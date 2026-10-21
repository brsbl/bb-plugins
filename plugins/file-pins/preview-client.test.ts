import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENT_PREVIEW_LIMITS, PreviewClient, previewKey, refreshNotice, type PreviewAnswer } from "./preview-client.js";

const text = { title: "Docs", description: "", site: "example.com", image: null };
const image = { ...text, image: "data:image/png;base64,AA==" };
const key = previewKey("thread", "pin", "https://example.com/");
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const at = (ms: number) => vi.spyOn(Date, "now").mockReturnValue(1_000_000 + ms);
afterEach(() => vi.restoreAllMocks());

describe("hover card preview cache", () => {
  it("refreshes GitHub facts sooner than static page metadata", async () => {
    at(0);
    const client = new PreviewClient();
    const github = { kind: "issue" as const, number: 7, repository: "acme/demo", state: "open" as const,
      stateReason: null, author: "alex", updatedAt: "2026-10-20", labels: [], assignees: [], comments: 0,
      branch: null, checks: null, review: null, mergeability: null };
    const call = vi.fn(async (): Promise<PreviewAnswer> => ({ preview: { ...text, github }, status: "no-image" }));
    await client.load(key, call);
    at(14_999); await client.load(key, call);
    expect(call).toHaveBeenCalledTimes(1);
    at(15_001); await client.load(key, call);
    expect(call).toHaveBeenCalledTimes(2);
  });
  it("shares one request across hovers and answers a repeat hover without asking again", async () => {
    at(0);
    const client = new PreviewClient();
    const answer = deferred<PreviewAnswer>();
    const call = vi.fn(() => answer.promise);
    const first = client.load(key, call);
    const second = client.load(key, call);
    expect(client.state(key)).toMatchObject({ loading: true });
    answer.resolve({ preview: image, status: "ready" });
    await Promise.all([first, second]);
    expect(client.state(key)).toEqual({ answer: { preview: image, status: "ready" }, loading: false, failed: false });
    await client.load(key, call);
    expect(call).toHaveBeenCalledTimes(1);
    // A stale answer stays on screen while the server is asked again.
    at(CLIENT_PREVIEW_LIMITS.freshMs + 1);
    const later = deferred<PreviewAnswer>();
    const reload = client.load(key, () => later.promise);
    expect(client.state(key)).toMatchObject({ answer: { preview: image }, loading: true });
    later.resolve({ preview: text, status: "no-image" });
    await reload;
    expect(client.state(key).answer).toEqual({ preview: text, status: "no-image" });
  });

  it("asks again soon after a failure instead of keeping it, but waits out a server-directed pause", async () => {
    at(0);
    const client = new PreviewClient();
    const call = vi.fn(async (): Promise<PreviewAnswer> => ({ preview: null, status: "timeout" }));
    await client.load(key, call);
    await client.load(key, call);
    expect(call).toHaveBeenCalledTimes(1);
    at(CLIENT_PREVIEW_LIMITS.retryMs + 1);
    call.mockRejectedValueOnce(new Error("offline"));
    await client.load(key, call);
    expect(client.state(key)).toMatchObject({ failed: true, answer: { status: "timeout" } });
    at(2 * CLIENT_PREVIEW_LIMITS.retryMs + 2);
    call.mockResolvedValueOnce({ preview: null, status: "rate-limited", retryAt: 1_000_000 + 120_000 });
    await client.load(key, call);
    at(60_000);
    await client.load(key, call);
    expect(call).toHaveBeenCalledTimes(3);
    at(120_001);
    call.mockResolvedValueOnce({ preview: text, status: "no-image" });
    await client.load(key, call);
    expect(client.state(key)).toMatchObject({ failed: false, answer: { preview: text } });
    // An older server's null preview is treated as a failure, not cached as an answer.
    const old = previewKey("thread", "old", "https://example.com/");
    const legacy = vi.fn(async (): Promise<PreviewAnswer> => ({ preview: null }));
    await client.load(old, legacy);
    at(120_001 + CLIENT_PREVIEW_LIMITS.retryMs + 1);
    await client.load(old, legacy);
    expect(legacy).toHaveBeenCalledTimes(2);
  });

  it("keeps the last preview through a failed refresh and never lets an earlier answer land after it", async () => {
    at(0);
    const client = new PreviewClient();
    await client.load(key, async () => ({ preview: image, status: "ready" }));
    at(CLIENT_PREVIEW_LIMITS.freshMs + 1);
    const slow = deferred<PreviewAnswer>();
    const load = client.load(key, () => slow.promise);
    const refreshed = deferred<PreviewAnswer>();
    const refreshCall = vi.fn(() => refreshed.promise);
    const refresh = client.refresh(key, refreshCall);
    expect(client.refresh(key, refreshCall)).toBe(refresh);
    expect(client.state(key)).toMatchObject({ answer: { preview: image }, loading: true });
    refreshed.resolve({ preview: null, status: "network" });
    expect(await refresh).toEqual({ preview: image, status: "network" });
    slow.resolve({ preview: text, status: "no-image" });
    await load;
    expect(client.state(key)).toEqual({ answer: { preview: image, status: "network" }, loading: false, failed: false });
    expect(refreshCall).toHaveBeenCalledTimes(1);
  });

  it("tells open cards about new answers and stops after they close", async () => {
    at(0);
    const client = new PreviewClient();
    const listener = vi.fn();
    const stop = client.subscribe(key, listener);
    await client.refresh(key, async () => ({ preview: text, status: "no-image" }));
    const calls = listener.mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(2);
    stop();
    await client.refresh(key, async () => ({ preview: image, status: "ready" }));
    expect(listener).toHaveBeenCalledTimes(calls);
    await expect(client.refresh(key, async () => { throw new Error("gone"); })).rejects.toThrow("gone");
    expect(client.state(key)).toMatchObject({ failed: true, answer: { preview: image } });
  });

  it("keeps entries per thread, pin and URL, bounded, without dropping an open card's entry", async () => {
    at(0);
    const client = new PreviewClient();
    const open = previewKey("thread", "open", "https://example.com/");
    client.subscribe(open, () => {});
    await client.load(open, async () => ({ preview: text, status: "no-image" }));
    for (let index = 0; index < CLIENT_PREVIEW_LIMITS.entries + 5; index++) {
      await client.load(previewKey("thread", `pin-${index}`, "https://example.com/"), async () => ({ preview: text, status: "no-image" }));
    }
    expect(client.state(open).answer).toEqual({ preview: text, status: "no-image" });
    expect(client.state(previewKey("thread", "pin-0", "https://example.com/")).answer).toBeUndefined();
    expect(client.state(previewKey("other", "pin-44", "https://example.com/")).answer).toBeUndefined();
    expect(client.state(previewKey("thread", "pin-44", "https://example.com/other")).answer).toBeUndefined();
  });

  it("only reports success when the server loaded the page now", () => {
    expect(refreshNotice({ preview: image, status: "ready" })).toEqual({ ok: true, message: "Preview refreshed" });
    expect(refreshNotice({ preview: text, status: "no-image" }).ok).toBe(true);
    expect(refreshNotice({ preview: image, status: "blocked" })).toEqual({ ok: false, message: "This site doesn't allow previews. Showing the last preview." });
    expect(refreshNotice({ preview: null, status: "rate-limited", retryAt: 1_000 + 90_000 }, 1_000)).toEqual({ ok: false, message: "This site is limiting requests. Try again in 2 min." });
    expect(refreshNotice({ preview: null }).ok).toBe(false);
  });
});
