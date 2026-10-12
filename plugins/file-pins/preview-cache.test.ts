import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readPublicResource } from "@brsbl/bb-website-icons";
import { LinkPreviews, PREVIEW_LIMITS, type PreviewDiagnostic } from "./link-preview.js";
import { ProviderRateLimited } from "./preview-providers.js";

vi.mock("@brsbl/bb-website-icons", async (original) => ({ ...await original<object>(), readPublicResource: vi.fn() }));
const read = vi.mocked(readPublicResource);

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const PAGE = "https://example.com/post";
const IMAGE_FILL = 2 * 1024 * 1024 - 1;
type Reply = { contentType: string; body: Buffer } | Error | (() => Promise<{ contentType: string; body: Buffer }>);
const html = (head: string) => ({ contentType: "text/html; charset=utf-8", body: Buffer.from(`<head>${head}</head>`) });
const png = (body = PNG) => ({ contentType: "image/png", body });
const httpError = (status: number, retryAt?: number) => Object.assign(new Error("Website resource is unavailable"), { reason: "http", status, retryAt });
const never = () => new Promise<never>(() => {});
const noProviders = { get: async () => null };

/** Routes mocked transport reads by URL; a function reply runs per request. */
function serve(routes: Record<string, Reply>) {
  read.mockImplementation(async (url) => {
    const reply = routes[url.href];
    if (!reply) throw httpError(404);
    if (reply instanceof Error) throw reply;
    const value = typeof reply === "function" ? await reply() : reply;
    return { url, ...value };
  });
}
const fetched = () => read.mock.calls.map(([url]) => url.href);

let previews: LinkPreviews;
beforeEach(() => { vi.useFakeTimers(); read.mockReset(); previews = new LinkPreviews({ providers: noProviders }); });
afterEach(() => { previews.dispose(); vi.useRealTimers(); });

it("coalesces concurrent loads and keeps a successful preview fresh for an hour", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  serve({ [PAGE]: async () => { await gate; return html('<meta property="og:title" content="Post">'); } });
  const first = previews.getResult(PAGE);
  const second = previews.getResult(PAGE);
  await vi.advanceTimersByTimeAsync(0);
  release();
  expect(await first).toEqual({ preview: { title: "Post", description: "", site: "example.com", image: null }, status: "no-image" });
  expect(await second).toEqual(await first);
  await vi.advanceTimersByTimeAsync(PREVIEW_LIMITS.freshMs - 1);
  expect((await previews.getResult(PAGE)).status).toBe("no-image");
  expect(read).toHaveBeenCalledTimes(1);
});

it("returns a stale preview at once and refreshes it once in the background", async () => {
  let title = "Old";
  serve({ [PAGE]: async () => html(`<meta property="og:title" content="${title}">`) });
  await previews.getResult(PAGE);
  vi.setSystemTime(Date.now() + PREVIEW_LIMITS.freshMs);
  title = "New";
  expect((await previews.getResult(PAGE)).preview?.title).toBe("Old");
  expect((await previews.getResult(PAGE)).preview?.title).toBe("Old");
  await vi.advanceTimersByTimeAsync(0);
  expect((await previews.getResult(PAGE)).preview?.title).toBe("New");
  expect(read).toHaveBeenCalledTimes(2);
});

it("keeps useful text and an earlier image through a transient failure, then retries after thirty seconds", async () => {
  let page: Reply = html('<meta property="og:title" content="Post"><meta property="og:image" content="/a.png">');
  read.mockImplementation(async (url) => {
    if (url.href === "https://example.com/a.png") return { url, ...png() };
    if (page instanceof Error) throw page;
    return { url, ...(page as { contentType: string; body: Buffer }) };
  });
  const ready = await previews.getResult(PAGE);
  expect(ready.status).toBe("ready");
  page = httpError(503);
  const failed = await previews.getResult(PAGE, true);
  expect(failed).toEqual({ preview: ready.preview, status: "network" });
  expect(await previews.get(PAGE)).toEqual(ready.preview);
  vi.setSystemTime(Date.now() + PREVIEW_LIMITS.transientMs - 1);
  await previews.getResult(PAGE);
  expect(read).toHaveBeenCalledTimes(3);
  vi.setSystemTime(Date.now() + 1);
  page = html('<meta property="og:title" content="Post again">');
  await previews.getResult(PAGE);
  await vi.advanceTimersByTimeAsync(0);
  expect((await previews.getResult(PAGE)).preview?.title).toBe("Post again");
});

it("distinguishes blocked pages, cools them down and lets a debounced refresh bypass the cooldown", async () => {
  serve({ [PAGE]: httpError(403) });
  expect(await previews.getResult(PAGE)).toEqual({ preview: null, status: "blocked" });
  vi.setSystemTime(Date.now() + PREVIEW_LIMITS.cooldownMs - 1);
  expect((await previews.getResult(PAGE)).status).toBe("blocked");
  expect(read).toHaveBeenCalledTimes(1);
  serve({ [PAGE]: html("<title>Open now</title>") });
  expect((await previews.getResult(PAGE, true)).status).toBe("no-image");
  expect((await previews.getResult(PAGE, true)).status).toBe("no-image");
  expect(read).toHaveBeenCalledTimes(2);
  vi.setSystemTime(Date.now() + PREVIEW_LIMITS.refreshDebounceMs);
  await previews.getResult(PAGE, true);
  expect(read).toHaveBeenCalledTimes(3);
  serve({ "https://example.com/gone": httpError(404) });
  expect((await previews.getResult("https://example.com/gone")).status).toBe("not-found");
});

it("never refreshes through a server-directed rate limit", async () => {
  const retryAt = Date.now() + 60 * 60_000;
  serve({ [PAGE]: httpError(429, retryAt) });
  expect(await previews.getResult(PAGE)).toEqual({ preview: null, status: "rate-limited", retryAt });
  vi.setSystemTime(retryAt - 1);
  expect((await previews.getResult(PAGE, true)).status).toBe("rate-limited");
  expect(read).toHaveBeenCalledTimes(1);
});

it("bounds active loads and the queue, and a full or slow queue is retryable rather than cached", async () => {
  serve({});
  read.mockImplementation(never);
  const urls = Array.from({ length: 21 }, (_, index) => `https://site${index}.com/`);
  const results = urls.map((url) => previews.getResult(url));
  await vi.advanceTimersByTimeAsync(0);
  expect(read).toHaveBeenCalledTimes(PREVIEW_LIMITS.active);
  expect(await results[20]).toEqual({ preview: null, status: "busy" });
  await vi.advanceTimersByTimeAsync(PREVIEW_LIMITS.queueWaitMs);
  expect(await results[4]).toEqual({ preview: null, status: "busy" });
  expect(await results[0]).toEqual({ preview: null, status: "timeout" });
  serve({ [urls[20]!]: html("<title>Later</title>") });
  expect((await previews.getResult(urls[20]!)).status).toBe("no-image");
});

it("settles active and queued work when disposed", async () => {
  read.mockImplementation(never);
  const results = Array.from({ length: 6 }, (_, index) => previews.getResult(`https://site${index}.com/`));
  await vi.advanceTimersByTimeAsync(0);
  previews.dispose();
  expect(await Promise.all(results)).toEqual(Array(6).fill({ preview: null, status: "busy" }));
  expect(read.mock.calls.every(([, signal]) => signal.aborted)).toBe(true);
});

it("tries at most three public candidates, keeps the first valid one and stays within six requests", async () => {
  serve({
    [PAGE]: html(`<meta property="og:title" content="Post">
      <meta property="og:image" content="http://example.com/insecure.png">
      <meta property="og:image" content="https://localhost/private.png">
      <meta property="og:image" content="/broken.png">
      <meta property="og:image" content="/svg.png">
      <meta property="twitter:image" content="/good.png">
      <meta property="twitter:image:src" content="/never.png">`),
    "https://example.com/broken.png": httpError(500),
    "https://example.com/svg.png": { contentType: "image/png", body: Buffer.from("<svg/>") },
    "https://example.com/good.png": png(),
  });
  const result = await previews.getResult(PAGE);
  expect(result.status).toBe("ready");
  expect(result.preview?.image).toBe(`data:image/png;base64,${PNG.toString("base64")}`);
  expect(fetched()).toEqual([PAGE, "https://example.com/broken.png", "https://example.com/svg.png", "https://example.com/good.png"]);
  expect(read.mock.calls.every(([, , budget, options]) => budget.redirects === 0 && options?.decodeCompressed === true && /BB-Link-Preview/.test(options.userAgent ?? ""))).toBe(true);
});

it("reports invalid images separately while keeping the text", async () => {
  serve({ [PAGE]: html('<meta property="og:title" content="Post"><meta property="og:image" content="/bad.png">'), "https://example.com/bad.png": png(Buffer.from("nope")) });
  expect(await previews.getResult(PAGE)).toEqual({ preview: { title: "Post", description: "", site: "example.com", image: null }, status: "invalid-image" });
});

it("fills gaps from one oEmbed endpoint using only its text and thumbnail", async () => {
  serve({
    [PAGE]: html('<meta name="description" content="Kept"><link rel="alternate" type="application/json+oembed" href="/oembed?u=1">'),
    "https://example.com/oembed?u=1": { contentType: "application/json", body: Buffer.from(JSON.stringify({ title: "Video", provider_name: "Tube", thumbnail_url: "/thumb.png", html: "<iframe src=x></iframe>" })) },
    "https://example.com/thumb.png": png(),
  });
  const { preview } = await previews.getResult(PAGE);
  expect(preview).toEqual({ title: "Video", description: "Kept", site: "Tube", image: `data:image/png;base64,${PNG.toString("base64")}` });
  expect(JSON.stringify(preview)).not.toContain("iframe");
});

it("times out each page request at five seconds within the load deadline", async () => {
  read.mockImplementation(never);
  const result = previews.getResult(PAGE);
  await vi.advanceTimersByTimeAsync(PREVIEW_LIMITS.pageMs);
  expect(await result).toEqual({ preview: null, status: "timeout" });
  expect(read.mock.calls[0]![1].aborted).toBe(true);
});

it("falls back from a failing provider to the page, but never around a provider pause", async () => {
  const providers = { get: vi.fn(async (_url: URL, providerRead: (url: URL) => Promise<unknown>) => { await providerRead(new URL("https://registry.npmjs.org/x/latest")); return null; }) };
  previews = new LinkPreviews({ providers });
  serve({ "https://registry.npmjs.org/x/latest": httpError(500), [PAGE]: html("<title>Page</title>") });
  expect((await previews.getResult(PAGE)).preview?.title).toBe("Page");
  expect(read.mock.calls[0]![3]?.accept).toMatch(/application\/json/);

  const retryAt = Date.now() + 120_000;
  providers.get.mockRejectedValue(new ProviderRateLimited(retryAt));
  read.mockClear();
  expect(await previews.getResult("https://stackoverflow.com/q/1")).toEqual({ preview: null, status: "rate-limited", retryAt });
  expect(read).not.toHaveBeenCalled();

  providers.get.mockRejectedValue(httpError(503));
  serve({ "https://www.npmjs.com/package/x": httpError(403) });
  expect((await previews.getResult("https://www.npmjs.com/package/x")).status).toBe("network");
});

it("evicts least-recently-used entries past forty URLs or the retained image budget", async () => {
  serve({});
  read.mockImplementation(async (url) => ({ url, ...html(`<title>${url.hostname}</title>`) }));
  for (let index = 0; index <= PREVIEW_LIMITS.entries; index++) await previews.getResult(`https://site${index}.com/`);
  read.mockClear();
  await previews.getResult(`https://site${PREVIEW_LIMITS.entries}.com/`);
  await previews.getResult("https://site0.com/");
  expect(fetched()).toEqual(["https://site0.com/"]);

  const large = Buffer.alloc(IMAGE_FILL);
  PNG.copy(large);
  previews.dispose();
  previews = new LinkPreviews({ providers: noProviders });
  read.mockImplementation(async (url) => ({ url, ...png(large) }));
  for (let index = 0; index < 10; index++) await previews.getResult(`https://img${index}.com/a.png`);
  read.mockClear();
  await previews.getResult("https://img9.com/a.png");
  await previews.getResult("https://img0.com/a.png");
  expect(fetched()).toEqual(["https://img0.com/a.png"]);
});

it("logs only bounded reason, status and timing", async () => {
  const logs: PreviewDiagnostic[] = [];
  previews = new LinkPreviews({ providers: noProviders, logger: (entry) => logs.push(entry) });
  serve({ [PAGE + "?token=secret"]: httpError(403) });
  await previews.getResult(PAGE + "?token=secret");
  expect(logs).toEqual([{ reason: "blocked", status: 403, elapsedMs: 0 }]);
});

it("does not grow the cache for a burst of distinct URLs while the queue is saturated", async () => {
  read.mockImplementation(never);
  const cache = (previews as unknown as { cache: Map<string, unknown> }).cache;
  const results = Array.from({ length: 300 }, (_, index) => previews.getResult(`https://burst${index}.com/`));
  await vi.advanceTimersByTimeAsync(0);
  expect(cache.size).toBe(PREVIEW_LIMITS.active + PREVIEW_LIMITS.pending);
  expect(await results[299]).toEqual({ preview: null, status: "busy" });
  await vi.advanceTimersByTimeAsync(PREVIEW_LIMITS.queueWaitMs);
  await Promise.all(results);
  expect(cache.size).toBeLessThanOrEqual(PREVIEW_LIMITS.active);
});

it("keeps text when an image is rate-limited, skips that origin and honors the pause on refresh", async () => {
  const retryAt = Date.now() + 15 * 60_000;
  serve({
    [PAGE]: html('<meta property="og:title" content="Post"><meta property="og:image" content="/a.png"><meta property="og:image" content="/b.png">'),
    "https://example.com/a.png": httpError(429, retryAt),
    "https://example.com/b.png": png(),
  });
  expect(await previews.getResult(PAGE)).toEqual({ preview: { title: "Post", description: "", site: "example.com", image: null }, status: "rate-limited", retryAt });
  expect(fetched()).toEqual([PAGE, "https://example.com/a.png"]);
  vi.setSystemTime(retryAt - 1);
  expect((await previews.getResult(PAGE, true)).retryAt).toBe(retryAt);
  expect(read).toHaveBeenCalledTimes(2);
});
