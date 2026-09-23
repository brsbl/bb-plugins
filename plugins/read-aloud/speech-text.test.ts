import { describe, expect, it } from "vitest";

import { toSpeechText } from "./speech-text";

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
});
