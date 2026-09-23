import { describe, expect, it } from "vitest";

import { chunkForSpeech, toSpeechText } from "./speech-text";

describe("toSpeechText", () => {
  it("reads prose and skips code, links, and directives", () => {
    const markdown = [
      "## Summary",
      "",
      "I updated **two files** in [the plugin](plugins/read-aloud) and `app.tsx`.",
      "",
      "```ts",
      "const secret = 1;",
      "```",
      "",
      "::inline-vis{file=\"demo.html\"}",
      "- Added a *Read aloud* button",
      "1. See https://example.com/docs for details",
    ].join("\n");

    expect(toSpeechText(markdown)).toBe(
      [
        "Summary.",
        "I updated two files in the plugin and app.tsx.",
        "Added a Read aloud button.",
        "See link for details.",
      ].join("\n"),
    );
  });

  it("skips multi-line and unterminated code blocks but keeps the prose after them", () => {
    expect(
      toSpeechText("Before\n```ts\nconst a = 1;\nconst b = 2;\n```\nAfter\n~~~\nx\ny\n~~~\nDone"),
    ).toBe("Before.\nAfter.\nDone.");
    expect(toSpeechText("Intro\n```sh\nnpm test\nnpm run build")).toBe("Intro.");
  });

  it("reads table rows as comma-separated phrases", () => {
    expect(toSpeechText("| Check | Result |\n| --- | --- |\n| Build | Passed |")).toBe(
      "Check, Result.\nBuild, Passed.",
    );
  });

  it("stays fast on hostile Markdown", () => {
    const inputs = ["<a".repeat(40_000), "[x](".repeat(40_000), "  \n".repeat(5_000), "**a".repeat(40_000)];
    for (const input of inputs) {
      const started = performance.now();
      toSpeechText(input);
      expect(performance.now() - started).toBeLessThan(1_000);
    }
  });
});

describe("chunkForSpeech", () => {
  it("keeps short sentences whole and splits long ones at clauses", () => {
    const long =
      "This sentence keeps going with several clauses, describing what changed in the plugin in detail; it should be split into readable pieces rather than one enormous block that takes a long time to synthesize.";
    const chunks = chunkForSpeech(`Build finished.\n${long}`);
    expect(chunks[0]).toBe("Build finished.");
    expect(chunks.slice(1).join(" ")).toBe(long);
    expect(chunks.length).toBeGreaterThan(2);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(140);
  });
});
