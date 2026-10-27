import { expect, it } from "vitest";
import { decode, metadataCandidates, pageMetadata } from "./preview-metadata.js";

it("keeps the existing pageMetadata shape and fallbacks", () => {
  expect(pageMetadata(`<head><title>Fallback &amp; title</title>
    <script><meta property="og:title" content="wrong"></script>
    <!-- <meta property="og:title" content="wrong"> -->
    <meta content='Page &quot;title&quot;' property='og:title'>
    <meta name=description content="A &lt;simple&gt; description">
    <meta property="og:site_name" content="Example">
    <meta property="og:image" content="/cover.png"></head>`)).toEqual({
    title: 'Page "title"', description: "A <simple> description", site: "Example", image: "/cover.png",
  });
  expect(pageMetadata("<title>Fallback &amp; title</title>")).toEqual({ title: "Fallback & title", description: "", site: "", image: null });
});

it("decodes entities to plain text and drops invalid code points", () => {
  expect(decode("  a&#x26;b &#60;i&#62;\n&nbsp;&bogus; &#0;&#x110000;c ")).toBe("a&b <i> &bogus; c");
});

it("orders image candidates by declaration kind, deduplicated", () => {
  expect(metadataCandidates(`<head>
    <link rel="image_src" href="/link.png">
    <meta name="twitter:image:src" content="/twitter-src.png">
    <meta name="twitter:image" content="/twitter.png">
    <meta property="og:image" content="/og-1.png">
    <meta property="og:image:url" content="/og-url.png">
    <meta property="og:image" content="/og-2.png">
    <meta property="og:image:secure_url" content="https://cdn.example/secure.png">
    <meta property="og:image" content="/og-1.png">
    <meta property="og:image" content="">
    <meta name="twitter:image" content="/og-2.png">
  </head>`).images).toEqual([
    "https://cdn.example/secure.png", "/og-1.png", "/og-url.png", "/og-2.png", "/twitter.png", "/twitter-src.png", "/link.png",
  ]);
});

it("ignores candidates in scripts, styles, comments and the body", () => {
  expect(metadataCandidates(`<head>
    <script>document.write('<meta property="og:image" content="/script.png">')</script>
    <style>/* <link rel="image_src" href="/style.png"> */</style>
    <!-- <meta property="og:image" content="/comment.png"> -->
    <meta property="og:image" content="/real.png">
  </head><body><meta property="og:image" content="/body.png"><img src="/img.png"></body>`)).toEqual({ images: ["/real.png"], oembed: null });
});

it("bounds the candidate list and skips oversized URLs", () => {
  const tags = Array.from({ length: 20 }, (_, i) => `<meta property="og:image" content="/${i}.png">`).join("");
  const { images } = metadataCandidates(`<meta property="og:image" content="/${"x".repeat(2048)}">${tags}`);
  expect(images).toEqual(Array.from({ length: 8 }, (_, i) => `/${i}.png`));
});

it("returns the first advertised JSON oEmbed endpoint, decoded", () => {
  expect(metadataCandidates(`<head>
    <link rel="alternate" type="text/xml+oembed" href="/oembed.xml">
    <link type="Application/JSON+oEmbed" rel="Alternate" href="/oembed?url=a&amp;format=json">
    <link rel="alternate" type="application/json+oembed" href="/second">
  </head>`)).toEqual({ images: [], oembed: "/oembed?url=a&format=json" });
});

it.each(["<meta ", "<!--", "<script>", "<title>", "attribute"])("bounds malformed full-size pages: %s", (kind) => {
  const fragment = kind === "attribute" ? "<meta " + "a".repeat(2 * 1024 * 1024) + ">" : kind;
  const html = fragment.repeat(Math.ceil(2 * 1024 * 1024 / fragment.length)).slice(0, 2 * 1024 * 1024);
  const started = performance.now();
  expect(pageMetadata(html)).toEqual({ title: "", description: "", site: "", image: null });
  expect(metadataCandidates(html)).toEqual({ images: [], oembed: null });
  // A generous CI ceiling catches quadratic rescans without requiring benchmark precision.
  expect(performance.now() - started).toBeLessThan(1000);
});

it("finds metadata after large raw text while preserving Unicode offsets", () => {
  const html = `<head><SCRIPT>${"İ<script><meta content='wrong'>".repeat(20000)}</SCRIPT>
    <title>Right &amp; title</title><meta property="og:image" content="/right.png"></head>`;
  expect(pageMetadata(html).title).toBe("Right & title");
  expect(metadataCandidates(html).images).toEqual(["/right.png"]);
});

it("bounds oversized tags and title text and stops at a body without a closing head", () => {
  expect(pageMetadata(`<title>${"x".repeat(20000)}</title>`).title).toBe("x".repeat(240));
  expect(metadataCandidates(`<meta content="${"x".repeat(9000)}" property="og:image">`).images).toEqual([]);
  expect(pageMetadata('<body><meta property="og:title" content="not head metadata">').title).toBe("");
  expect(pageMetadata('<meta ignored boolean content="a > b" property="og:title">').title).toBe("a > b");
});
