import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { RequestOptions } from "node:https";
import { PNG } from "pngjs";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ dns: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.dns }));
vi.mock("node:https", () => ({ request: mocks.request }));
import { declaredIcons, decodeIcon, ICON_LIMITS, IconService, isPublicAddress, publicLookup, publicOrigin, readPublicResource, resolveIcon } from "./index.js";

afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); });

function png(width = 2, height = 2): Buffer {
  const image = new PNG({ width, height });
  image.data.fill(255);
  return PNG.sync.write(image);
}

function network(replies: Array<{ status?: number; location?: string; type?: string; body?: Buffer; length?: string }>) {
  const requests: Array<{ url: URL; options: RequestOptions }> = [];
  mocks.request.mockImplementation((url: URL, options: RequestOptions, respond: (reply: unknown) => void) => {
    requests.push({ url, options });
    const request = new EventEmitter() as EventEmitter & { end(): void; destroy(error: Error): void };
    request.end = () => {
      const next = replies.shift();
      if (!next) { request.emit("error", new Error("No fixture response")); return; }
      const reply = Object.assign(new PassThrough(), { statusCode: next.status ?? 200, headers: { location: next.location, "content-type": next.type ?? "image/png", "content-length": next.length } });
      request.destroy = (error) => { reply.destroy(); request.emit("error", error); };
      respond(reply);
      if (!reply.destroyed) reply.end(next.body ?? Buffer.alloc(0));
    };
    return request;
  });
  return requests;
}

describe("public origin and connection policy", () => {
  it.each([
    "http://github.com", "https://github.com:8443", "https://user:secret@github.com", "https://github.com/private?token=secret#key",
    "https://localhost", "https://printer.local", "https://foo.internal", "https://127.0.0.1", "https://2130706433", "https://[::1]", "https://github.com.",
  ])("never looks up %s", async (input) => {
    const resolver = vi.fn();
    const service = new IconService({ get: () => undefined, put: vi.fn() }, resolver);
    expect(publicOrigin(input)).toBeNull();
    expect(await service.get(input)).toBeNull();
    expect(resolver).not.toHaveBeenCalled();
  });

  it.each(["0.0.0.0", "10.1.2.3", "100.64.1.1", "127.0.0.1", "169.254.169.254", "172.16.1.1", "192.168.1.1", "192.0.2.5", "198.19.1.1", "203.0.113.1", "224.0.0.1", "::1", "::ffff:127.0.0.1", "fe80::1", "fc00::1", "2001:db8::1", "2002:7f00:1::", "2001::1"])("rejects non-public connection %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it("pins only a vetted DNS answer into the socket lookup, rejecting mixed public/private answers", async () => {
    const lookup = publicLookup();
    const run = () => new Promise<unknown>((resolve) => lookup("example.com", { family: 0, hints: 0 }, (...args: unknown[]) => resolve(args)));
    mocks.dns.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    expect(await run()).toEqual([null, "93.184.216.34", 4]);
    expect(mocks.dns).toHaveBeenCalledTimes(1);
    mocks.dns.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }, { address: "10.1.1.1", family: 4 }]);
    const result = await run() as unknown[];
    expect(result[0]).toBeInstanceOf(Error);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
  });

  it("validates each redirected destination and uses fresh pinned lookups without credentials", async () => {
    const requests = network([{ status: 302, location: "https://cdn.example.com/icon.png" }, { body: png() }]);
    await readPublicResource(new URL("https://example.com/favicon.ico"), new AbortController().signal, { redirects: 0 });
    expect(requests.map(({ url }) => url.href)).toEqual(["https://example.com/favicon.ico", "https://cdn.example.com/icon.png"]);
    expect(requests.every(({ options }) => options.agent === false && typeof options.lookup === "function")).toBe(true);
    for (const { options } of requests) expect(options.headers).not.toHaveProperty("Cookie");
    expect(requests[0]!.options.headers).not.toHaveProperty("Referer");
    network([{ status: 302, location: "https://169.254.169.254/metadata" }]);
    await expect(readPublicResource(new URL("https://example.com/favicon.ico"), new AbortController().signal, { redirects: 0 })).rejects.toThrow("not public");
  });

  it("bounds redirects and both advertised and chunked response sizes", async () => {
    network(Array.from({ length: 3 }, () => ({ status: 302, location: "/again" })));
    await expect(readPublicResource(new URL("https://example.com/favicon.ico"), new AbortController().signal, { redirects: 0 })).rejects.toThrow("redirects");
    network([{ length: String(ICON_LIMITS.inputBytes + 1) }]);
    await expect(readPublicResource(new URL("https://example.com/favicon.ico"), new AbortController().signal, { redirects: 0 })).rejects.toThrow();
    network([{ body: Buffer.alloc(ICON_LIMITS.inputBytes + 1) }]);
    await expect(readPublicResource(new URL("https://example.com/favicon.ico"), new AbortController().signal, { redirects: 0 })).rejects.toThrow("large");
  });

  it("allows a larger bounded preview image without changing the default icon budget", async () => {
    const body = Buffer.alloc(400 * 1024);
    network([{ body, length: String(body.length) }]);
    const resource = await readPublicResource(new URL("https://example.com/cover.png"), new AbortController().signal, { redirects: 0 }, { maxBytes: 2 * 1024 * 1024 });
    expect(resource.body.length).toBe(body.length);
    network([{ body: Buffer.alloc(2 * 1024 * 1024 + 1) }]);
    await expect(readPublicResource(new URL("https://example.com/cover.png"), new AbortController().signal, { redirects: 0 }, { maxBytes: 2 * 1024 * 1024 })).rejects.toThrow("large");
  });
});

describe("bounded raster icons", () => {
  it("re-encodes PNG and standard 32-bit ICO data; never returns fetched markup", () => {
    const data = decodeIcon(png(256, 128))!;
    const normalized = PNG.sync.read(Buffer.from(data.split(",")[1]!, "base64"));
    expect([normalized.width, normalized.height]).toEqual([128, 64]);
    const ico = Buffer.alloc(22 + 40 + 16);
    ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
    ico[6] = 2; ico[7] = 2; ico.writeUInt32LE(56, 14); ico.writeUInt32LE(22, 18);
    ico.writeUInt32LE(40, 22); ico.writeInt32LE(2, 26); ico.writeInt32LE(4, 30);
    ico.writeUInt16LE(1, 34); ico.writeUInt16LE(32, 36); ico.fill(255, 62);
    expect(decodeIcon(ico)).toMatch(/^data:image\/png;base64,/);
    expect(decodeIcon(Buffer.from('<svg onload="alert(1)"><script/></svg>'))).toBeNull();
    const oversized = png(); oversized.writeUInt32BE(100_000, 16);
    expect(decodeIcon(oversized)).toBeNull();
    const interlaced = png(); interlaced[28] = 1;
    expect(decodeIcon(interlaced)).toBeNull();
    const original = png();
    const duplicateHeader = Buffer.concat([original.subarray(0, 33), original.subarray(8, 33), original.subarray(33)]);
    expect(decodeIcon(duplicateHeader)).toBeNull();
    expect(decodeIcon(Buffer.alloc(ICON_LIMITS.inputBytes + 1))).toBeNull();
  });

  it("falls back from favicon to a declared public icon without fetching the pasted path", async () => {
    const requests = network([{ status: 404 }, { type: "text/html", body: Buffer.from('<link rel="shortcut icon" href="https://cdn.example.com/logo.png?v=1&amp;size=32">') }, { body: png() }]);
    expect(await resolveIcon("https://example.com", new AbortController().signal)).toMatch(/^data:image\/png;base64,/);
    expect(requests.map(({ url }) => url.href)).toEqual(["https://example.com/favicon.ico", "https://example.com/", "https://cdn.example.com/logo.png?v=1&size=32"]);
    expect(declaredIcons('<link rel="icon" href="http://insecure.example.com/a"><link rel="icon" href="https://user:pw@example.com/a"><link rel="icon" href="/valid.png">', new URL("https://example.com/"))).toEqual([new URL("https://example.com/valid.png")]);
    const head = Buffer.from('<link rel="icon" href="/head.png">');
    const page = Buffer.concat([head, Buffer.alloc(ICON_LIMITS.inputBytes)]);
    network([{ status: 404 }, { type: "text/html", body: page, length: String(page.length) }, { body: png() }]);
    expect(await resolveIcon("https://example.com", new AbortController().signal)).toMatch(/^data:image\/png;base64,/);
    expect(declaredIcons('<script>"<link rel="icon" href="/fake.png">"</script><!-- <link rel="icon" href="/fake.png"> --><link rel="icon" href="/real.png">', new URL("https://example.com/"))).toEqual([new URL("https://example.com/real.png")]);
  });
});

it("deduplicates origins, limits concurrency and cancels active and queued lookups on setting off", async () => {
  const cache = { get: () => undefined, put: vi.fn() };
  const resolve = vi.fn((_origin: string, signal: AbortSignal) => new Promise<string | null>((_ok, reject) => signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true })));
  const service = new IconService(cache, resolve);
  const first = service.get("https://one.example.com");
  expect(service.get("https://one.example.com")).toBe(first);
  const work = [first, ...Array.from({ length: 8 }, (_, i) => service.get(`https://host${i}.example.com`))];
  await Promise.resolve();
  expect(resolve).toHaveBeenCalledTimes(4);
  service.setEnabled(false);
  expect(await Promise.all(work)).toEqual(Array(9).fill(null));
  expect(resolve).toHaveBeenCalledTimes(4);
  expect(cache.put).not.toHaveBeenCalled();
  expect(await service.get("https://another.example.com")).toBeNull();
});

it("times out queued and active work in five seconds, negative-caching failures", async () => {
  vi.useFakeTimers();
  const cache = { get: () => undefined, put: vi.fn() };
  const service = new IconService(cache, (_origin, signal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true })));
  const work = Array.from({ length: 6 }, (_, i) => service.get(`https://host${i}.example.com`));
  await vi.advanceTimersByTimeAsync(ICON_LIMITS.timeoutMs);
  expect(await Promise.all(work)).toEqual(Array(6).fill(null));
  expect(cache.put).toHaveBeenCalledTimes(6);
});
