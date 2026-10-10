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

it("reads late head metadata on large pages such as YouTube", async () => {
  const resources = await import("@brsbl/bb-website-icons");
  const html = `<head><script>${" ".repeat(800_000)}</script><meta property="og:title" content="Video title"></head>`;
  const fetch = vi.spyOn(resources, "readPublicResource").mockImplementation(async (url, _signal, _budget, options) => ({
    url, contentType: "text/html", body: Buffer.from(html).subarray(0, options?.maxBytes ?? 256 * 1024),
  }));
  const previews = new LinkPreviews();
  try { expect((await previews.get("https://www.youtube.com/watch?v=example"))?.title).toBe("Video title"); }
  finally { previews.dispose(); fetch.mockRestore(); }
});

it("previews a direct raster image instead of discarding non-HTML responses", async () => {
  const resources = await import("@brsbl/bb-website-icons");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  const fetch = vi.spyOn(resources, "readPublicResource").mockImplementation(async (url) => ({ url, contentType: "image/png", body: png }));
  const previews = new LinkPreviews();
  try { expect((await previews.get("https://example.com/cover.png"))?.image).toBe(`data:image/png;base64,${png.toString("base64")}`); }
  finally { previews.dispose(); fetch.mockRestore(); }
});

it("accepts bounded static WebP thumbnails and rejects animation, truncation and huge canvases", () => {
  // Extended WebP header, following https://developers.google.com/speed/webp/docs/riff_container.
  const webp = Buffer.alloc(40);
  webp.write("RIFF"); webp.writeUInt32LE(webp.length - 8, 4); webp.write("WEBPVP8X", 8); webp.writeUInt32LE(10, 16);
  webp.writeUIntLE(1279, 24, 3); webp.writeUIntLE(719, 27, 3);
  expect(previewImage(webp)).toBe(`data:image/webp;base64,${webp.toString("base64")}`);
  expect(previewImage(webp.subarray(0, 35))).toBeNull();
  webp[20] = 2;
  expect(previewImage(webp)).toBeNull();
  webp[20] = 0; webp.writeUIntLE(9999, 24, 3);
  expect(previewImage(webp)).toBeNull();
});
