import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import { createStore, type ImageFile } from "./server.js";
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
