import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin, { createStore, readFromThreadHost, type ImageFile } from "./server.js";
import { MAX_IMAGE_BYTES } from "./model.js";

const png = (tag: string) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(tag)]);
const hosts: ReturnType<typeof createFakePluginHost>[] = [];
afterEach(async () => { for (const host of hosts.splice(0)) await host.harness.lifecycle.dispose(); });

function setup(files: Record<string, Buffer>) {
  const host = createFakePluginHost({ pluginId: "image-carousel" });
  hosts.push(host);
  const reads: { cwd?: string; path: string }[] = [];
  const store = createStore(host.bb, async ({ cwd, path }): Promise<ImageFile> => {
    reads.push({ cwd, path });
    const bytes = files[path];
    if (!bytes) throw new Error(`missing ${path}`);
    return { bytes, name: path.split("/").at(-1)! };
  });
  return { store, reads, db: host.bb.storage.database() };
}
const count = (db: ReturnType<typeof setup>["db"]) => (db.prepare("SELECT COUNT(*) AS n FROM images").get() as { n: number }).n;

describe("image carousel store", () => {
  it("copies each distinct image once and keeps pairs in slide order", async () => {
    const { store, reads, db } = setup({ "a.png": png("a"), "b.png": png("b"), "c.png": png("a") });
    const carousel = await store.create("thr_1", { kind: "before-after", slides: [
      { before: "a.png", after: "b.png", title: "Search" },
      { before: "b.png", after: "c.png", title: "Icons", description: "Colored tiles" },
    ] }, "/work");
    expect(carousel.id).toMatch(/^ic_[a-z0-9]{12}$/);
    expect(reads).toEqual([{ cwd: "/work", path: "a.png" }, { cwd: "/work", path: "b.png" }, { cwd: "/work", path: "c.png" }]);
    expect(count(db)).toBe(2);
    const saved = store.get(carousel.id);
    if (saved.kind !== "before-after") throw new Error("wrong kind");
    expect(saved.slides.map((slide) => [slide.title, slide.before.name, slide.after.name])).toEqual([["Search", "a.png", "b.png"], ["Icons", "b.png", "c.png"]]);
    expect(saved.slides[1]!.after.sha256).toBe(saved.slides[0]!.before.sha256);
    expect(Buffer.from(store.image(saved.slides[0]!.before.sha256).data, "base64")).toEqual(png("a"));
  });

  it("rejects non-images, oversized files, and bad input without saving anything", async () => {
    const { store, db } = setup({ "shot.png": png("x"), "vector.svg": Buffer.from("<svg/>"), "huge.png": Buffer.concat([png("h"), Buffer.alloc(MAX_IMAGE_BYTES)]) });
    await expect(store.create("thr_1", { kind: "research", slides: [{ image: "shot.png", title: "A" }, { image: "vector.svg", title: "B" }] })).rejects.toThrow("not a PNG, JPEG, GIF, or WebP");
    await expect(store.create("thr_1", { kind: "research", slides: [{ image: "huge.png", title: "A" }] })).rejects.toThrow("larger than 8 MB");
    await expect(store.create("thr_1", { kind: "research", slides: [{ image: "shot.png", title: "A", source: "javascript:alert(1)" }] })).rejects.toThrow();
    await expect(store.create("thr_1", { kind: "research", slides: [] })).rejects.toThrow();
    expect(count(db)).toBe(0);
    expect(store.list()).toEqual([]);
  });

  it("removes a carousel and only the image copies no other carousel uses", async () => {
    const { store, db } = setup({ "a.png": png("a"), "b.png": png("b") });
    const first = await store.create("thr_1", { kind: "research", title: "First", slides: [{ image: "a.png", title: "A" }, { image: "b.png", title: "B" }] });
    const second = await store.create("thr_2", { kind: "research", slides: [{ image: "a.png", title: "A again" }] });
    expect(store.list("thr_1")).toMatchObject([{ id: first.id, title: "First", slides: 2, kind: "research" }]);
    expect(store.list().map((item) => item.id).sort()).toEqual([first.id, second.id].sort());
    store.remove(first.id);
    expect(() => store.get(first.id)).toThrow("unavailable");
    expect(count(db)).toBe(1);
    expect(store.get(second.id).slides).toHaveLength(1);
    store.remove(second.id);
    expect(count(db)).toBe(0);
  });
});

describe("image reads stay on the invoking thread's machine", () => {
  const pngBase64 = png("x").toString("base64");
  function hostWith(environment: { hostId: string; path: string | null } | null) {
    const host = createFakePluginHost({ pluginId: "image-carousel", sdk: {
      threads: { get: () => ({ id: "thr_1", ...(environment ? { environment } : {}) }) },
      files: { read: () => ({ content: pngBase64, contentEncoding: "base64", sizeBytes: 9, path: "/x", sha256: "0" }) },
      system: { config: () => ({ primaryHostId: "host_primary" }) },
    } });
    hosts.push(host);
    return host;
  }

  it("reads relative paths from the thread's own machine and directory", async () => {
    const host = hostWith({ hostId: "host_thread", path: "/work/tree" });
    await readFromThreadHost(host.bb)({ threadId: "thr_1", path: "shots/a.png" });
    expect(host.harness.inspection.sdk.callsTo("files.read")).toEqual([[{ hostId: "host_thread", path: "/work/tree/shots/a.png" }]]);
  });

  it("refuses to fall back to another machine when the thread has no environment", async () => {
    const host = hostWith(null);
    await expect(readFromThreadHost(host.bb)({ threadId: "thr_1", cwd: "/elsewhere", path: "a.png" })).rejects.toThrow("no machine");
    expect(host.harness.inspection.sdk.callsTo("files.read")).toEqual([]);
  });

  it("only creates carousels for the thread that runs the command", async () => {
    const host = hostWith({ hostId: "host_thread", path: "/work" });
    plugin(host.bb);
    const carousel = JSON.stringify({ kind: "research", slides: [{ image: "a.png", title: "A" }] });
    expect((await host.harness.behavior.runCli(["create", "--carousel", carousel])).stderr).toContain("Run create from the bb thread");
    expect((await host.harness.behavior.runCli(["create", "--carousel", carousel, "--thread", "thr_other"], { threadId: "thr_1" })).exitCode).not.toBe(0);
    expect(host.harness.inspection.sdk.callsTo("files.read")).toEqual([]);
  });
});
