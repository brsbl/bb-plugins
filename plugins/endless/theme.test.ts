import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "./package.json" with { type: "json" };

/**
 * bb caps a theme stylesheet at 256 KB and delivers it to the client as an
 * inline string, so these are contract tests rather than style tests: they
 * guard the two ways a theme plugin breaks silently after it is installed.
 */
const CSS_MAX_BYTES = 256_000;

const themes = manifest.bb.themes;
const cssFor = (t: (typeof themes)[number]) =>
  readFileSync(resolve(__dirname, t.css), "utf8");
const [endless, endlessColor] = themes;
const css = cssFor(endless);

describe("Endless theme contribution", () => {
  it("declares the family: endless plus its colour variant", () => {
    expect(themes).toHaveLength(2);
    expect(endless.id).toBe("endless");
    expect(endlessColor.id).toBe("endless-color");
    for (const t of themes) expect(cssFor(t).length).toBeGreaterThan(0);
  });

  it("endless-color derives from endless rather than forking it", () => {
    // The variant is the endless stylesheet plus appended overrides — the
    // foil-sleeve light block and the blacklight dark block — so structure
    // (radius, type, noise, every shared rule) comes from the same bytes.
    const colorCss = cssFor(endlessColor);
    expect(colorCss.startsWith(css)).toBe(true);
    const override = colorCss.slice(css.length);
    expect(override).toContain(":root:not(.dark)");
    expect(override).toContain(".dark {");
  });

  it("stays under bb's stylesheet cap", () => {
    for (const t of themes)
      expect(Buffer.byteLength(cssFor(t), "utf8")).toBeLessThan(CSS_MAX_BYTES);
  });

  it("themes both modes", () => {
    // bb ships one stylesheet for both; a missing block silently inherits the
    // default palette for that mode instead of failing.
    expect(css).toContain(":root,\n.light {");
    expect(css).toContain(".dark {");
    for (const token of ["--canvas", "--ink", "--primary", "--radius"]) {
      // Both blocks must pin every anchor, or the light value leaks into dark:
      // `:root` and `.dark` have equal specificity and this sheet loads last.
      expect(css.split(token).length - 1).toBeGreaterThanOrEqual(2);
    }
  });

  it("carries no path that only exists on the authoring machine", () => {
    // Type is system-native (Helvetica Neue / Courier), so nothing is
    // embedded and no file:// URL may appear in either stylesheet.
    for (const t of themes) {
      const c = cssFor(t);
      expect(c).not.toContain("file://");
      expect(c).not.toMatch(/\/Users\/|\/home\/|[A-Z]:\\/);
    }
  });

  it("fails the generated-theme contrast audit when a text pair falls below its floor", () => {
    const directory = mkdtempSync(join(tmpdir(), "endless-contrast-"));
    try {
      const fixture = resolve(directory, "failing.css");
      writeFileSync(fixture, css.replace("--foreground: #0a0a0a;", "--foreground: #b0b0b0;"));
      const audit = spawnSync("python3", [resolve(__dirname, "build/palette.py"), fixture], {
        encoding: "utf8",
      });
      expect(audit.status, `${audit.stdout}\n${audit.stderr}`).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
