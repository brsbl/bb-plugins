import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { RequestOptions } from "node:https";
import { PNG } from "pngjs";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ dns: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.dns }));
vi.mock("node:https", () => ({ request: mocks.request }));
import { randomBytes } from "node:crypto";
import { brotliCompressSync, deflateRawSync, deflateSync, gzipSync } from "node:zlib";
import { declaredIcons, decodeIcon, ICON_LIMITS, IconService, isPublicAddress, publicLookup, publicOrigin, readPublicResource, resolveIcon, WebsiteResourceError } from "./index.js";

afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); });

function png(width = 2, height = 2): Buffer {
  const image = new PNG({ width, height });
  image.data.fill(255);
  return PNG.sync.write(image);
}

type Fixture = { status?: number; location?: string; type?: string; body?: Buffer; length?: string; headers?: Record<string, string>; chunks?: Buffer[]; hang?: boolean };

function network(replies: Fixture[]) {
  const requests: Array<{ url: URL; options: RequestOptions; reply?: PassThrough; destroyed: boolean }> = [];
  mocks.request.mockImplementation((url: URL, options: RequestOptions, respond: (reply: unknown) => void) => {
    const record: (typeof requests)[number] = { url, options, destroyed: false };
    requests.push(record);
    const request = new EventEmitter() as EventEmitter & { end(): void; destroy(error?: Error): void };
    request.destroy = (error) => { record.destroyed = true; record.reply?.destroy(); request.emit("error", error); };
    request.end = () => {
      const next = replies.shift();
      if (!next) { request.emit("error", new Error("No fixture response")); return; }
      const reply = Object.assign(new PassThrough(), { statusCode: next.status ?? 200, headers: { location: next.location, "content-type": next.type ?? "image/png", "content-length": next.length, ...next.headers } });
      record.reply = reply;
      respond(reply);
      if (reply.destroyed) return;
      for (const chunk of next.chunks ?? []) reply.write(chunk);
      if (!next.hang) reply.end(next.body ?? Buffer.alloc(0));
    };
    return request;
  });
  return requests;
}

const read = (url: string, options?: Parameters<typeof readPublicResource>[3], signal = new AbortController().signal) =>
  readPublicResource(new URL(url), signal, { redirects: 0 }, options);

async function failure(work: Promise<unknown>): Promise<WebsiteResourceError> {
  const error = await work.then(() => { throw new Error("Expected a failure"); }, (caught: unknown) => caught);
  expect(error).toBeInstanceOf(WebsiteResourceError);
  expect(error).toBeInstanceOf(Error);
  return error as WebsiteResourceError;
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
    expect((result[0] as WebsiteResourceError).reason).toBe("url");
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
    network([{ length: String(ICON_LIMITS.inputBytes + 1) }]);
    expect((await failure(read("https://example.com/favicon.ico"))).reason).toBe("too-large");
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

describe("public resource transport", () => {
  it("keeps the shipped favicon request and identity-only response contract by default", async () => {
    const requests = network([{ body: png() }, { body: gzipSync(png()), headers: { "content-encoding": "gzip" } }]);
    const resource = await read("https://example.com/favicon.ico");
    expect(Object.keys(resource).sort()).toEqual(["body", "contentType", "url"]);
    expect(requests[0]!.options.headers).toEqual({ Accept: "image/png,image/x-icon,text/html;q=0.5,*/*;q=0.1", "Accept-Encoding": "identity", "User-Agent": "BB-URL-Pills/0.1" });
    const error = await failure(read("https://example.com/favicon.ico"));
    expect([error.reason, error.message]).toEqual(["encoding", "Website resource is unavailable"]);
    await expect(read("https://example.com/", { userAgent: "bad\r\nCookie: x" })).rejects.toThrow("header");
    expect((await failure(read("https://127.0.0.1/"))).reason).toBe("url");
  });

  it("decodes gzip, zlib and raw deflate, and Brotli only when the caller opts in", async () => {
    const page = Buffer.from(`<html><head><title>${"Preview ".repeat(500)}</title></head></html>`);
    const requests = network([
      { body: gzipSync(page), headers: { "content-encoding": "gzip" } },
      { body: gzipSync(page), headers: { "content-encoding": "x-gzip" } },
      { body: deflateSync(page), headers: { "content-encoding": "deflate" } },
      { body: deflateRawSync(page), headers: { "content-encoding": "deflate" } },
      { body: brotliCompressSync(page), headers: { "content-encoding": "br" } },
      { body: page, headers: { "content-encoding": "identity" } },
    ]);
    const options = { decodeCompressed: true, accept: "text/html,application/xhtml+xml;q=0.9", userAgent: "BB-Link-Preview/1.0" };
    for (let index = 0; index < 6; index++) expect((await read("https://example.com/", options)).body.equals(page)).toBe(true);
    expect(requests[0]!.options.headers).toEqual({ Accept: options.accept, "Accept-Encoding": "gzip, deflate, br", "User-Agent": "BB-Link-Preview/1.0" });
    network([{ body: page, headers: { "content-encoding": "zstd" } }, { body: Buffer.from("not gzip at all"), headers: { "content-encoding": "gzip" } }, { body: gzipSync(page).subarray(0, 40), headers: { "content-encoding": "gzip" } }]);
    for (let index = 0; index < 3; index++) expect((await failure(read("https://example.com/", options))).reason).toBe("encoding");
  });

  it("bounds decoded and wire bytes of compressed responses and truncates only when asked", async () => {
    const maxBytes = 64 * 1024;
    const bomb = gzipSync(Buffer.alloc(8 * 1024 * 1024, "a"));
    expect(bomb.length).toBeLessThan(maxBytes);
    network([{ body: bomb, headers: { "content-encoding": "gzip" } }]);
    expect((await failure(read("https://example.com/", { decodeCompressed: true, maxBytes }))).reason).toBe("too-large");
    network([{ body: bomb, headers: { "content-encoding": "gzip" } }]);
    const truncated = await read("https://example.com/", { decodeCompressed: true, maxBytes, truncate: true });
    expect(truncated.body.equals(Buffer.alloc(maxBytes, "a"))).toBe(true);
    const noise = gzipSync(randomBytes(maxBytes * 2));
    network([{ body: noise, headers: { "content-encoding": "gzip" }, length: String(noise.length) }]);
    expect((await failure(read("https://example.com/", { decodeCompressed: true, maxBytes }))).reason).toBe("too-large");
    const requests = network([{ chunks: [noise.subarray(0, maxBytes / 2), noise.subarray(maxBytes / 2, maxBytes + 1)], hang: true, headers: { "content-encoding": "gzip" } }]);
    const partial = await read("https://example.com/", { decodeCompressed: true, maxBytes, truncate: true });
    expect(partial.body.length).toBeLessThanOrEqual(maxBytes);
    expect(requests[0]!.reply!.destroyed).toBe(true);
  });

  it("tears down the request, response and decoder when aborted mid-body", async () => {
    for (const headers of [{}, { "content-encoding": "gzip" }]) {
      const controller = new AbortController();
      const requests = network([{ chunks: [gzipSync(Buffer.alloc(1024)).subarray(0, 20)], hang: true, headers }]);
      const work = read("https://example.com/", { decodeCompressed: true }, controller.signal);
      await new Promise((resolve) => setImmediate(resolve));
      controller.abort();
      await expect(work).rejects.toHaveProperty("name", "AbortError");
      expect(requests[0]!.destroyed).toBe(true);
      expect(requests[0]!.reply!.destroyed).toBe(true);
    }
  });

  it("reports HTTP status and a bounded Retry-After", async () => {
    const before = Date.now();
    network([
      { status: 404 },
      { status: 429, headers: { "retry-after": "120" } },
      { status: 503, headers: { "retry-after": new Date(before + 60_000).toUTCString() } },
      { status: 429, headers: { "retry-after": "999999999" } },
      { status: 503, headers: { "retry-after": "Mon, 01 Jan 1990 00:00:00 GMT" } },
      { status: 429, headers: { "retry-after": "soon" } },
    ]);
    const errors: WebsiteResourceError[] = [];
    for (let index = 0; index < 6; index++) errors.push(await failure(read("https://example.com/")));
    const after = Date.now();
    expect(errors.map(({ reason, status, message }) => [reason, status, message])).toEqual(
      [404, 429, 503, 429, 503, 429].map((status) => ["http", status, "Website resource is unavailable"]));
    expect(errors[0]!.retryAt).toBeUndefined();
    expect(errors[1]!.retryAt).toBeGreaterThanOrEqual(before + 120_000);
    expect(errors[1]!.retryAt).toBeLessThanOrEqual(after + 120_000);
    expect(errors[2]!.retryAt).toBeGreaterThanOrEqual(before + 59_000);
    expect(errors[2]!.retryAt).toBeLessThanOrEqual(after + 60_000);
    expect(errors[3]!.retryAt).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);
    expect(errors[4]!.retryAt).toBeGreaterThanOrEqual(before);
    expect(errors[4]!.retryAt).toBeLessThanOrEqual(after);
    expect(errors[5]!.retryAt).toBeUndefined();
  });

  it("classifies redirect failures and keeps the two-redirect budget across hops", async () => {
    const cases: Array<[Fixture[], string]> = [
      [Array.from({ length: 3 }, () => ({ status: 302, location: "/again" })), "Too many website redirects"],
      [[{ status: 301, location: "http://example.com/" }], "Website redirect is not public HTTPS"],
      [[{ status: 308, location: "https://user:pw@example.com/" }], "Website redirect is not public HTTPS"],
      [[{ status: 302, location: "https://[bad" }], "Website redirect is not public HTTPS"],
      [[{ status: 307 }], "Website redirect has no location"],
    ];
    for (const [replies, message] of cases) {
      network(replies);
      const error = await failure(read("https://example.com/"));
      expect([error.reason, error.message]).toEqual(["redirect", message]);
    }
    const requests = network([{ status: 302, location: "/one" }, { status: 303, location: "https://cdn.example.com/two" }, { body: png() }]);
    expect((await read("https://example.com/")).url.href).toBe("https://cdn.example.com/two");
    expect(requests.every(({ options }) => options.agent === false && typeof options.lookup === "function" && !("Referer" in options.headers!) && !("Authorization" in options.headers!))).toBe(true);
  });

  it("classifies connection failures as network errors", async () => {
    mocks.request.mockImplementation(() => {
      const request = new EventEmitter() as EventEmitter & { end(): void; destroy(): void };
      request.destroy = vi.fn();
      request.end = () => { request.emit("error", new Error("ECONNRESET")); };
      return request;
    });
    const error = await failure(read("https://example.com/"));
    expect([error.reason, error.message, (error.cause as Error).message]).toEqual(["network", "Website resource is unreachable", "ECONNRESET"]);
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
