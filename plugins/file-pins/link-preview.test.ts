import { expect, it, vi } from "vitest";
import { LinkPreviews, pageMetadata, previewImage } from "./link-preview.js";

it("extracts plain metadata with fallbacks and excludes scripts and comments", () => {
  expect(pageMetadata(`<head><title>Fallback &amp; title</title>
    <script><meta property="og:title" content="wrong"></script>
    <!-- <meta property="og:title" content="wrong"> -->
    <meta content='Page &quot;title&quot;' property='og:title'>
    <meta name=description content="A &lt;simple&gt; description">
    <meta property="og:site_name" content="Example">
    <meta property="og:image" content="/cover.png"></head>`)).toEqual({
    title: 'Page "title"', description: "A <simple> description", site: "Example", image: "/cover.png",
  });
  expect(pageMetadata('<title>Fallback &amp; title</title>').title).toBe("Fallback & title");
});

it("rejects markup and oversized raster dimensions", () => {
  expect(previewImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
  const png = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.writeUInt32BE(5000, 16); png.writeUInt32BE(100, 20);
  expect(previewImage(png)).toBeNull();
});

it("does not fetch local addresses or request previews after disposal", async () => {
  const previews = new LinkPreviews();
  const load = vi.spyOn(previews as unknown as { load(): Promise<null> }, "load");
  for (const url of ['http://localhost:3000', 'https://127.0.0.1', 'https://internal.local', 'https://user:pass@example.com']) {
    expect(await previews.get(url)).toBeNull();
  }
  previews.dispose();
  expect(await previews.get('https://example.com')).toBeNull();
  expect(load).not.toHaveBeenCalled();
});
