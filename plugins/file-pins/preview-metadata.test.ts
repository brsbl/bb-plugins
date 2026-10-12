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
